/**
 * Created by bangbang93 on 2017/9/13.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const request = require('request');
const crypto = require('crypto');
// 转换驼峰命名
const pascalCase = require('pascal-case');
const Stream = require('stream');
const shortid = require('shortid');
const mime = require('mime');
const ProgressBar = require('progress');
// const qs = require('qs');
const config = require(path.resolve(process.cwd(), './ufile-config'));


class UFile {
  /**
   * UFile SDK
   * @param {string} publicKey api公钥
   * @param {string} privateKey api私钥
   * @param {string} bucket 存储空间名
   * @param {string} domain 存储空间域名
   * @param {boolean} protocol 网络协议头
   */
  constructor({ publicKey, privateKey, bucket, domain, protocol } = config) {
    this.publicKey = publicKey || config.publicKey;
    this.privateKey = privateKey || config.privateKey;
    this.bucket = bucket || config.bucket;
    this.domain = domain || config.domain;
    this.protocol = protocol || config.protocol;
    this.resoureUrl = this._getResourceUrl();
  }

  _getResourceUrl({ bucket, domain, protocol } = this) {
    return `${protocol || this.protocol}://${bucket || this.bucket}${domain || this.domain}`;
  }

  _getKey(file_path, file_prefix = '', filename, unique) {
    file_path = file_path.replace(/\\/g, "/");
    file_prefix = !file_prefix || file_prefix.endsWith('/') ? file_prefix : file_prefix + '/';
    filename = filename ? `${filename}${filename.indexOf('.') !== -1 ? '' : path.extname(file_path)}`
      : path.basename(file_path);
    let key = file_prefix + filename;
    if (unique) {
      const id = (typeof (unique) === 'string' || typeof (unique) === 'number') ? unique : shortid.generate();
      const keyArr = key.split('.');
      key = `${keyArr[0]}_${id}.${keyArr[keyArr.length - 1]}`;
    }
    return key;
  }
  /**
   * 前缀列表查询
   * @param {string} [prefix=''] 前缀，utf-8编码，默认为空字符串
   * @param {string} [marker=''] 标志字符串，utf-8编码，默认为空字符串
   * @param {number} [limit=20] 文件列表数目，默认为20
   * @returns {Promise}
   */
  async getPrefixFileList({ prefix, marker, limit }) {
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
   * 上传文件
   * @param {string} key 
   * @returns {Array} 上传成功的资源路径
   */
  async putFile({ key, file_path, file_prefix, filename, unique = false }) {
    key = key || this._getKey(file_path, file_prefix, filename, unique);
    const method = "PUT";
    const headers = {
      'Content-Type': getMimeType(file_path),
      'Content-Length': getFileSize(file_path)
    };
    let uploadRes;
    try {
      const { response } = await new Promise((resolve, reject) => {
        const uploadStream = this._sendRequest({ key, headers, method }, resolve, reject)
          .on('response', ({ statusCode }) => {
            if (statusCode !== 200) {
              return;
            }
            console.log('  Uploading...');
          });
        fs.createReadStream(file_path).pipe(uploadStream);
      })
      const { request: { href: url } = {} } = response;
      uploadRes = { code: 1, url }
    } catch (error) {
      return Promise.reject(error);
    }
    return uploadRes;


    // return new Promise((resolve, reject) => {
    //   const uploadStream = request.put({
    //     url: `${this.resoureUrl}/${key}`,
    //     headers: {
    //       Authorization: `UCloud ${this.publicKey}:${this.sign({ method: "PUT", headers, key })}`,
    //       ...headers
    //     }
    //   }, (error, { request: { href: url } = {}, statusCode, statusMessage } = {}, body) => {
    //     if (error || statusCode !== 200) {
    //       reject({ statusCode, statusMessage, msg: error || JSON.parse(body || '{}') })
    //       return;
    //     }
    //     const res = { code: 1, url };
    //     resolve(res);
    //   }).on('response', ({ statusCode }) => {
    //     if (statusCode !== 200) {
    //       return;
    //     }
    //     console.log('  Uploading...');

    //   });
    //   fs.createReadStream(file_path).pipe(uploadStream);
    // })
  }

  /**
    * 文件转移
    * @param {Array} urlArr 源文件链接数组，数组元素可为字符串或对象
    * @returns {Array} 转移后的资源路径
    */
  transferFile(urlArr = []) {
    let promises = [];
    urlArr.every((item) => {
      if (typeof (item) === 'string') {
        item = { url: item }
      } else if (Object.prototype.toString.call(item) !== '[object Object]') {
        promises.push(Promise.reject('Invalid type'))
        return false;
      }
      // const { file_prefix, filename, unique, key } = item;
      const promise = new Promise(async (resolve, reject) => {
        try {
          const { path: file_path } = await this.getFile({ url: item.url });
          const { url: resUrl } = await this.putFile({ file_path, ...item });
          resolve(resUrl);
          unlinkFile(file_path);
        } catch (error) {
          reject(error);
        }
      })
      promises.push(promise);
      return true;
    })


    return Promise.all(promises)
  }

  /**
   * 秒传文件
   * @param {string} hash 待上传文件的ETag,详见ETag生成文档
   * @param {string} fileName Bucket中文件的名称
   * @param {string} fileSize 待上传文件的大小
   * @returns {Promise}
   */
  uploadHit({ hash, fileName, fileSize }) {
    return this._sendRequest({
      url: `${this.protocol}://${this.bucket}${this.domain}/uploadhit`,
      query: {
        Hash: hash,
        FileName: fileName,
        FileSize: fileSize,
      }
    })
  }

  /**
   * 下载文件
   * @param {string} key key
   * @returns {Promise}
   */
  async getFile({ url, key, file_save_dir = './download', file_save_name, containPrefix = false }) {
    if (!key && !url) {
      return Promise.reject('Define url or key!')
    } else {
      url = url || `${this.resoureUrl}/${key}`
    }
    if (!file_save_name) {
      if (containPrefix && key) {
        file_save_name = file_save_name || key.replace(/\//g, '_');
      } else {
        file_save_name = file_save_name || path.basename(url);
      }
    }
    file_save_name = file_save_name.indexOf('.') !== -1 ? file_save_name : file_save_name + '.dl';
    const file_save_path = path.resolve(file_save_dir, file_save_name);
    const method = "GET";
    let downloadRes;
    try {
      const res = await new Promise((resolve, reject) => {
        const downloadStream = this._sendRequest({ method, url }, resolve, reject)
          .on('response', (res) => {
            const total = parseInt(res.headers['content-length']);
            if (res.statusCode !== 200) {
              const { statusCode, statusMessage } = res;
              reject({ statusCode, statusMessage })
              unlinkFile(file_save_path);
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
                console.log('\n');
              }
            });
          });
        downloadStream.pipe(fs.createWriteStream(file_save_path));
      });
      downloadRes = { code: 1, path: file_save_path }
    } catch (error) {
      return Promise.reject(error);
    }
    return downloadRes;

    return new Promise((resolve, reject) => {
      const downloadStream = request.get({
        url: url,
      }, (error, { statusCode, statusMessage } = {}, body) => {
        if (error || statusCode !== 200) {
          reject({ statusCode, statusMessage, msg: error || JSON.parse(body || '{}') })
          return;
        }
        resolve({ code: 1, path: file_save_path })
      }).on('response', (res) => {
        const total = parseInt(res.headers['content-length']);
        if (res.statusCode !== 200) {
          const { statusCode, statusMessage } = res;
          reject({ statusCode, statusMessage })
          unlinkFile(file_save_path);
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
            console.log('\n');
          }
        });
      });

      downloadStream.pipe(fs.createWriteStream(file_save_path));
    })

    // return this._sendRequest({
    //   key,
    //   headers: {
    //     range,
    //     'if-modified-since': ifModifiedSince
    //   }
    // })
  }


  _sendRequest({ url, method = 'GET', headers, key = '', query, body }, outerResolve, outerReject) {
    url = url || `${this.resoureUrl}/${key}`;
    const options = {
      url,
      method,
      headers: {
        Authorization: `UCloud ${this.publicKey}:${this.sign({ method, headers, key })}`,
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
      if (error || response.statusCode !== 200) {
        const { statusCode, statusMessage } = response;
        reject({ statusCode, statusMessage, msg: error || body })
        return;
      }
      resolve({ response, body });
    })
    if (outerResolve && outerReject) {
      return req(outerResolve, outerReject);
    } else {
      return new Promise((resolve, reject) => {
        req(resolve, reject);
      })
    }


  }

  sign({ method = 'GET', headers = {}, bucket = this.bucket, key = '' } = {}) {
    let p = [method.toUpperCase(), getHeader('content-md5'), getHeader('content-type'), getHeader('date')]
    Object.keys(headers)
      .sort()
      .forEach((key) => {
        if (key.toLowerCase().startsWith('x-ucloud')) {
          p.push(`${key.toLowerCase()}:${getHeader(key)}`)
        }
      })
    p.push(`/${bucket}/${key}`)
    const stringToSign = p.join('\n')
    return hmacSha1(stringToSign, this.privateKey)

    function getHeader(key) {
      let r = headers[key] || headers[key.toLowerCase()]
      if (r) return r
      const keys = Object.keys(headers)
      for (const k of keys) {
        if (k.toLowerCase() === key) {
          return headers[k]
        }
      }
      return ''
    }
  }


  _sign(req, key) {
    let p = [req.method.toUpperCase(), req.get('content-md5') || '', req.get('content-type') || '', req.get('date') || '']

    Object.keys(req.header)
      .sort()
      .forEach((key) => {
        if (key.startsWith('X-UCloud')) {
          p.push(`${key.toLowerCase()}:${req.get(key)}`)
        }
      })
    p.push(`/${this.bucket}${key}`)
    const stringToSign = p.join('\n')
    return hmacSha1(stringToSign, this.privateKey)
  }






  /**
   * 查询文件基本信息
   * @param {string} key
   * @returns {Promise}
   */
  headFile(key) {
    if (typeof key === 'object') {
      key = key.key
    }
    return this._sendRequest({
      key,
      method: 'head'
    })
  }

  /**
   * 删除文件
   * @param {string} key
   * @returns {Promise}
   */
  deleteFile(key) {
    if (typeof key === 'object') {
      key = key.key
    }
    return this._sendRequest({
      key,
      method: 'delete'
    })
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

module.exports = UFile



function hmacSha1(str, privateKey, digest = 'base64') {
  return crypto.createHmac('sha1', privateKey).update(str).digest(digest)
}

function pascalObject(obj) {
  const r = {};
  Object.keys(obj)
    .forEach((key) => {
      r[pascalCase(key)] = obj[key]
    })
  return r
}

function getMimeType(file_path) {
  var ret = mime.getType(file_path);
  if (!ret) {
    return "application/octet-stream";
  }
  return ret;
}

function getFileSize(file_path) {
  var stats = fs.statSync(file_path);
  return stats.size;
}

function unlinkFile(file) {
  if (typeof (file) === 'string') {
    file = [file]
  } else if (!Array.isArray(file)) {
    return
  }
  file.forEach((item) => {
    fs.unlink(item, () => {
      // console.log(item);
    })
  })
}