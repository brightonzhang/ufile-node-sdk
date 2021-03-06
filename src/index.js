const path = require('path');
const fs = require('fs');
const request = require('request');
const _ = require('lodash');
const ProgressBar = require('progress');
const chalk = require('chalk');
const {
  getEtag,
  hmacSha1,
  getKey,
  getMimeType,
  getFileSize,
  unlinkFile,
} = require('./helper');


class UFile {
  /**
   * UFile SDK
   * @param {string} publicKey api公钥
   * @param {string} privateKey api私钥
   * @param {string} bucket 存储空间名
   * @param {string} domain 存储空间域名
   * @param {boolean} protocol 网络协议头
   */
  constructor(config = {}) {
    config = this._resolveConfig(config);
    if (!config.publicKey || !config.privateKey) {
      console.log(chalk.red('ERROR: Please specify UFile config while initiating or give a config file'));
      return;
    }
    const { publicKey, privateKey, bucket, domain, protocol, cdnDomain } = config;
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.bucket = bucket;
    this.domain = domain;
    this.protocol = protocol;
    this.cdnDomain = cdnDomain;
  }


  _resolveConfig(config) {
    const configFilePath = path.resolve(process.cwd(), './ufile-config.json');
    if (fs.existsSync(configFilePath)) {
      let pathConfig = require(configFilePath);
      return _.assign(pathConfig, config);
    } else {
      return config;
    }
  }


  _getResourceUrl(key = '') {
    return `${this.protocol}://${this.bucket}${this.domain}${!!key ? `/${key}` : ''}`;
  }


  _getCdnUrl(key = '') {
    return !!this.cdnDomain ? `${this.protocol}://${this.cdnDomain}${!!key ? `/${key}` : ''}` : this._getResourceUrl(key);
  }


  /**
  * 返回一个修改部分参数的UFile对象
  * @param {Object} props ufile配置参数
  * @returns {UFile} 新的UFile对象
  */
  setProps(props) {
    const { publicKey, privateKey, bucket, domain, protocol } = this;
    //assign会改变原对象,不能用this直接作为参数
    const newConfig = _.assign({ publicKey, privateKey, bucket, domain, protocol }, props);
    return new UFile(newConfig);
  }


  /**
   * 前缀列表查询
   * @param {string} prefix 前缀，utf-8编码
   * @param {string} marker 标志字符串，utf-8编码
   * @param {number} limit 文件列表数目，默认为20
   * @returns {Promise}
   */
  async getPrefixFileList({ prefix, marker, limit } = {}) {
    const method = "GET";
    const query = {
      list: '',
      prefix,
      marker,
      limit,
    };
    let prefixFileList;
    try {
      const res = await this._sendRequest({ query, method });
      // console.log(res);
      prefixFileList = res.body
    } catch (error) {
      //一定要return否则上层无法捕获
      return Promise.reject(error);
    }
    return prefixFileList;
  }


  /**
    * 秒传文件
   * @param {string} key 文件key，会屏蔽prefix和fileRename
   * @param {string} filePath 待上传文件的路径
   * @param {string} prefix 文件前缀
   * @param {string} fileRename 重命名文件名（若无后缀会自动加上后缀）
   * @param {Boolean|string|Number} unique 是否唯一，若传入ture则自动生成id，若传入Number或string则将其作为id
   * @returns {Object} 状态码及上传成功的资源路径
    */
  async uploadHit({ key, filePath, prefix, fileRename, unique = false } = {}) {
    key = key || getKey(filePath, prefix, fileRename, unique);
    try {
      const method = "POST";
      const fileSize = getFileSize(filePath);
      const query = {
        Hash: await getEtag(filePath, fileSize),
        FileName: key,
        FileSize: fileSize,
      }
      await this._sendRequest({
        key,
        method,
        query,
        url: `${this._getResourceUrl()}/uploadhit`
      });
    } catch (error) {
      if (error.statusCode === 404) {
        return { code: 0, url: '', msg: 'Not hit' };
      }
      return Promise.reject(error);
    }
    return { code: 1, url: `${this._getCdnUrl(key)}`, msg: 'Hit success' };
  }



  /**
   * 上传文件
   * @param {string} key 文件key，会屏蔽prefix和fileRename
   * @param {string} filePath 待上传文件的路径
   * @param {string} prefix 文件前缀
   * @param {string} fileRename 重命名文件名（若无后缀会自动加上后缀）
   * @param {Boolean|string|Number} unique 是否唯一，若传入ture则自动生成id，若传入Number或string则将其作为id
   * @returns {Object} 状态码及上传成功的资源路径
   */
  async putFile({ key, filePath, prefix, fileRename, unique = false } = {}) {
    console.log(chalk.blue('INFO'), (' Uploading...'));

    key = key || getKey(filePath, prefix, fileRename, unique);
    const method = "PUT";
    const headers = {
      'Content-Type': getMimeType(filePath),
      'Content-Length': getFileSize(filePath)
    };
    let uploadRes;
    try {
      const { response } = await new Promise((resolve, reject) => {
        const uploadStream = this._sendRequest({ key, headers, method }, resolve, reject)
          .on('response', ({ statusCode }) => {
            if (statusCode !== 200) {
              return;
            }
          });
        fs.createReadStream(filePath).pipe(uploadStream);
      })
      console.log(chalk.green('SUCCESS'), (' Upload Complete '), '\n');

      uploadRes = { code: 1, url: `${this._getCdnUrl(key)}` }
    } catch (error) {
      return Promise.reject(error);
    }
    return uploadRes;
  }


  /**
   * 下载文件
   * @param {string} key key
   * @returns {Object} 状态码及文件保存路径
   */
  async getFile({ url, key, fileSaveDir = './download', fileSaveName, containPrefix = false } = {}) {
    if (!key && !url) {
      return Promise.reject('Define url or key!')
    } else {
      url = url || `${this._getCdnUrl(key)}`
    }
    if (!fileSaveName) {
      if (containPrefix && key) {
        fileSaveName = fileSaveName || key.replace(/\//g, '_');
      } else {
        fileSaveName = fileSaveName || path.basename(url);
      }
    }
    fileSaveName = fileSaveName.indexOf('.') !== -1 ? fileSaveName : fileSaveName + '.dl';
    const fileSavePath = path.resolve(fileSaveDir, fileSaveName);
    const method = "GET";
    let downloadRes;
    try {
      await new Promise((resolve, reject) => {
        const downloadStream = this._sendRequest({ method, url }, resolve, reject)
          .on('response', (res) => {
            const total = parseInt(res.headers['content-length']);
            if (res.statusCode !== 200) {
              const { statusCode, statusMessage } = res || {};
              reject({ statusCode, statusMessage })
              unlinkFile(fileSavePath);
              return;
            }
            const bar = new ProgressBar('  Downloading :percent [:bar] at :speed MB/s :elapseds spent', {
              complete: '=',
              incomplete: ' ',
              width: 20,
              total,
              renderThrottle: '100'
            });
            res.on('data', function (chunk) {
              const speed = ((bar.curr / ((new Date - bar.start) / 1000)) / 1048576).toFixed(1);
              bar.tick(chunk.length, { speed });
              if (bar.complete) {
                console.log(chalk.green('SUCCESS'), (' Download complete '));
                console.log('\n');
              }
            });
          });
        downloadStream.pipe(fs.createWriteStream(fileSavePath));
      });
      downloadRes = { code: 1, path: fileSavePath }
    } catch (error) {
      return Promise.reject(error);
    }
    return downloadRes;
  }


  /**
    * 文件转移
    * @param {Array} urlArr 源文件链接数组，数组元素可为字符串或对象
    * @returns {Array} 转移后的资源路径
    */
  transferFile(urlArr = []) {
    let promises = [];
    urlArr.every((item) => {
      if (_.isString(item)) {
        item = { url: item }
      } else if (Object.prototype.toString.call(item) !== '[object Object]') {
        promises.push(Promise.reject('Invalid type'))
        return false;
      }
      const uploadConfig = _.pick(item, ['prefix', 'fileRename', 'unique', 'key']);

      const promise = new Promise(async (resolve, reject) => {
        let filePath = '';
        try {
          filePath = (await this.getFile({ url: item.url })).path;
          const { url: resUrl } = await this.putFile({ filePath, ...uploadConfig });
          resolve(resUrl);
        } catch (error) {
          reject(error);
        }
        unlinkFile(filePath);
      })
      promises.push(promise);
      return true;
    })
    return Promise.all(promises)
  }


  /**
   * 查询文件基本信息
   * @param {string} key
   * @returns {Object} API响应头
   */
  async headFile(key = '') {
    if (_.isObject(key) && !_.isArray(key)) {
      key = key.key
    }

    const { response } = await this._sendRequest({
      method: 'HEAD',
      key
    })
    return response.headers;
  }


  /**
   * 删除文件
   * @param {string} key
   * @returns {Object} 状态码和状态信息
   */
  async deleteFile(key = '') {
    if (_.isObject(key) && !_.isArray(key)) {
      key = key.key
    }
    try {
      await this._sendRequest({
        method: 'DELETE',
        key
      })
    } catch (error) {
      console.log(chalk.yellow('WARNING'), (' Remote file not exist'))
      return { code: 0, msg: error.statusMessage };
    }
    return { code: 1, msg: 'Delete success' };
  }


  /**
   * 发送请求
   * @param {string} url 请求的url，会屏蔽key
   * @param {string} method 请求方法
   * @param {string} headers 请求头 
   * @param {string} key  请求key
   * @param {string} query  查询参数
   * @param {string} body 请求体
   * @returns {request|Promise} 状态码和状态信息
   */
  _sendRequest({ url, method = 'GET', headers, key = '', query, body } = {}, outerResolve, outerReject) {
    url = url || `${this._getResourceUrl(key)}`;
    const options = {
      url,
      method,
      headers: {
        Authorization: `UCloud ${this.publicKey}:${this._sign({ method, headers, key })}`,
        ...headers
      },
      qs: query,
      body
    };

    const req = (resolve, reject) => request(options, (error, response, body) => {
      // console.log(response.request.href);
      try {
        body && (body = JSON.parse(body))
      } catch{
        body = ''
      }
      if (error || !(response.statusCode >= 200 && response.statusCode < 300)) {
        const { statusCode, statusMessage } = response || {};
        reject({ statusCode, statusMessage, msg: error || body })
        return;
      }
      resolve({ response, body });
    });

    if (outerResolve && outerReject) {
      return req(outerResolve, outerReject);
    } else {
      return new Promise((resolve, reject) => {
        req(resolve, reject);
      })
    }
  }


  /**
   * 生成签名
   * @param {string} method 请求方法
   * @param {string} headers 请求头 
   * @param {string} bucket  资源bucket
   * @param {string} key  请求key
   * @param {string} body 请求体
   * @returns {request|Promise} 状态码和状态信息
   */
  _sign({ method = 'GET', headers = {}, bucket = this.bucket, key = '' } = {}) {
    let p = [method.toUpperCase(), getHeader('content-md5'), getHeader('content-type'), getHeader('date')]
    Object.keys(headers)
      .sort()
      .forEach((headerName) => {
        if (headerName.toLowerCase().startsWith('x-ucloud')) {
          p.push(`${headerName.toLowerCase()}:${getHeader(headerName)}`)
        }
      })
    p.push(`/${bucket}/${key}`);
    const stringToSign = p.join('\n');
    // console.log(stringToSign);
    return hmacSha1(stringToSign, this.privateKey);

    function getHeader(headerName) {
      let r = headers[headerName] || headers[headerName.toLowerCase()]
      if (r) return r
      const keys = Object.keys(headers)
      for (const k of keys) {
        if (k.toLowerCase() === headerName) {
          return headers[k]
        }
      }
      return ''
    }
  }


  /**
   * 初始化分片上传
   * @param {string} key 文件名
   * @returns {Promise}
   */
  initiateMultipartUpload({ key }) {
    return this._sendRequest({
      method: 'post',
      key,
      query: {
        uploads: ''
      }
    })
  }


  /**
   * 上传分片
   * @param {string} key 文件名
   * @param {string} uploadId 分片id
   * @param {number} partNumber 第几块分片
   * @param {buffer} buffer 内容
   * @returns {Promise}
   */
  uploadPart({ key, uploadId, partNumber, buffer }) {
    return this._sendRequest({
      method: 'put',
      key,
      query: {
        uploadId,
        partNumber,
      },
      body: buffer,
    })
  }


  /**
   * 完成分片
   * @param {string} key 文件名
   * @param {string} uploadId 分片id
   * @param {string} [newKey] 等上传完毕开始指定的key可能已经被占用,遇到这种情形时会采用newKey参数的值作为文件最终的key，否则仍然采用原来的key
   * @param {array} parts 分片的etag们
   * @returns {Promise}
   */
  finishMultipartUpload({ key, uploadId, newKey, parts }) {
    return this._sendRequest({
      method: 'post',
      key,
      query: {
        uploadId,
        newKey,
      },
      body: parts.join(',')
    })
  }


  /**
   * 放弃分片
   * @param {string} key 文件名
   * @param {string} uploadId 分片id
   * @returns {Promise}
   */
  abortMultipartUpload({ key, uploadId }) {
    return this._sendRequest({
      method: 'delete',
      key,
      query: {
        uploadId,
      }
    })
  }


  /**
   * 获取正在执行的分片上传
   * @param {string} [prefix] 前缀，utf-8编码，默认为空字符串
   * @param {string} [marker] 标志字符串，utf-8编码，默认为空字符串
   * @param {number} [limit=20] id列表数目，默认为20
   * @returns {Promise}
   */
  getMultiUploadId({ prefix, marker, limit }) {
    return this._sendRequest({
      method: 'get',
      query: {
        prefix,
        marker,
        limit,
      }
    })
  }


  /**
   * 获取已上传成功的分片列表
   * @param {string} uploadId 上传id
   * @returns {Promise}
   */
  getMultiUploadPart({ uploadId }) {
    return this._sendRequest({
      method: 'get',
      query: {
        muploadpart: '',
        uploadId,
      }
    })
  }


  /**
   * 操作文件的Meta信息
   * @param {string} key key
   * @param {string} mimeType 文件的mimetype
   * @returns {Promise}
   */
  opMeta({ key, mimeType }) {
    return this._sendRequest({
      method: 'post',
      key,
      query: {
        opmeta: ''
      },
      body: {
        op: 'ste',
        metak: 'mimetype',
        metav: mimeType,
      }
    })
  }
}


module.exports = UFile;



