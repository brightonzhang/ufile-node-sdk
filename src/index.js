/**
 * Created by bangbang93 on 2017/9/13.
 */
'use strict';
const path = require('path');
const fs = require('fs');
const request = require('request');
const crypto = require('crypto')
const pascalCase = require('pascal-case')
const Stream = require('stream')
const mime = require('mime');
const _ = require('lodash');
const ProgressBar = require('progress');
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
    this.resoureUrl = this._getResourcUrl();
  }

  _getResourcUrl({ bucket, domain, protocol } = this) {
    return `${protocol || this.protocol}://${bucket || this.bucket}${domain || this.domain}`;
  }

  _getKey(file_path, file_prefix = '', filename, unique) {
    file_path = file_path.replace(/\\/g, "/");
    file_prefix = !file_prefix || file_prefix.endsWith('/') ? file_prefix : file_prefix + '/';
    filename = filename ? `${filename}${filename.indexOf('.') !== -1 ? '' : file_path.substr(file_path.lastIndexOf('.'))}`
      : file_path.substr(file_path.lastIndexOf('/') + 1);
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
  prefixFileList({ prefix, marker, limit }) {
    return this._request({
      url: `${this.protocol}://${this.bucket}${this.domain}`,
      query: {
        list: '',
        prefix,
        marker,
        limit
      }
    })
  }

  /**
   * 上传文件
   * @param {string} key
   * @param {Buffer|Stream.Readable|string} file 文件
   * @param {string} [mimeType='application/octet-stream'] 文件类型
   * @returns {Promise}
   */
  putFile({ key, file_path, file_prefix, filename, unique = false }) {
    key = key || this._getKey(file_path, file_prefix, filename, unique);
    const headers = {
      'Content-Type': getMimeType(file_path),
      'Content-Length': getFileSize(file_path)
    };
    const up_file = fs.createReadStream(file_path);
    return new Promise((resolve, reject) => {
      const uploadStream = () => request.put({
        url: `${this.resoureUrl}/${key}`,
        headers: {
          Authorization: `UCloud ${this.publicKey}:${this.sign({ method: "PUT", headers, key })}`,
          ...headers
        }
      }, function (error, { request: { href: url } = {}, statusCode, statusMessage } = {}, body) {
        if (error || statusCode !== 200) {
          reject({ statusCode, statusMessage, msg: error || body })
          return;
        }
        const res = { code: 1, url };
        resolve(res);
      }).on('response', ({ statusCode }) => {
        if (statusCode === 200) {
          console.log('Uploading...');
        }
      })
      up_file.pipe(uploadStream());
    })
  }

  /**
    * 文件转移
    * @param {string}  
    */
  async transferFile({ keyArr = [], originUrl, target_file_prefix }) {
    let promises = [];


    keyArr.forEach((key) => {
      const promise = new Promise(async (resolve, reject) => {
        try {
          const { path: file_path } = await this.getFile({ resoureUrl: originUrl, key });
          const { url: resUrl } = await this.putFile({ file_path, file_prefix: target_file_prefix });
          resolve(resUrl);
          unlinkFile(file_path);
        } catch (error) {
          console.log(error);
        }
      })
      promises.push(promise);
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
    return this._request({
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
   * @param {string} [range] 分片下载的文件范围
   * @param {string} [ifModifiedSince] 只返回从某时修改过的文件，否则返回304(not modified)
   * @returns {Promise}
   */
  getFile({ resoureUrl = this.resoureUrl, key, file_save_dir = './download', file_save_name, containPrefix = false }) {
    if (!file_save_name) {
      if (containPrefix) {
        file_save_name = file_save_name || key.replace('/', '_');
      } else {
        file_save_name = file_save_name || key.substr(key.lastIndexOf('/') !== -1 ? key.lastIndexOf('/') + 1 : 0);
      }
    }
    file_save_name = file_save_name.indexOf('.') !== -1 ? file_save_name : file_save_name + '.dl';
    const file_save_path = path.resolve(file_save_dir, file_save_name);
    return new Promise((resolve, reject) => {
      const downloadStream = () => request.get({
        url: `${resoureUrl}/${key}`,
      }, function (error, res, body) {
        if (error) {
          reject(error);
          return;
        }
        resolve({ code: 1, path: file_save_path })
      }).on('response', (res) => {
        const total = parseInt(res.headers['content-length']);
        if (res.statusCode === 200) {
          // console.log('Downloading...');
          var bar = new ProgressBar('  Downloading :percent [:bar] at :speed MB/s :elapseds spent', {
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
        } else {
          const { statusCode, statusMessage } = res;
          reject({ statusCode, statusMessage })
          unlinkFile(file_save_path)
        }
      })
      downloadStream().pipe(fs.createWriteStream(file_save_path));
    })

    // return this._request({
    //   key,
    //   headers: {
    //     range,
    //     'if-modified-since': ifModifiedSince
    //   }
    // })
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
    return this._request({
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
    return this._request({
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
    return this._request({
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
    return this._request({
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
    return this._request({
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
    return this._request({
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
    return this._request({
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
    return this._request({
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
    return this._request({
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

  _request({ url, query, body, method = 'get', files, headers, key = '' }) {
    if (!key.startsWith('/')) {
      key = '/' + key
    }
    if (!url) {
      url = `${this.protocol}://${this.bucket}${this.domain}${key}`
    }

    const req = superagent(method, url)
    req.use((req) => {
      req.set('Authorization', `UCloud ${this.publicKey}:${this._sign(req, key)}`)
    })
    if (headers) {
      req.set(headers)
    }
    req.set('User-Agent', 'nodejs-sdk-ver/1.0.3')


    switch (method.toLowerCase()) {
      case 'post':
      case 'put':
      case 'patch':
        if (files) {
          req.field(body)
          Object.keys(files)
            .forEach((key) => {
              req.attach(key, files[key])
            })
        } else {
          req.send(body)
        }
        break
      default:
        break
    }
    if (query) {
      req.query(query)
    }
    return req
  }

  sign({ method, headers, bucket = this.bucket, key = '' }) {
    if (!key.startsWith('/')) {
      key = '/' + key
    }
    let p = [method.toUpperCase(), getHeader('content-md5'), getHeader('content-type'), getHeader('date')]
    Object.keys(headers)
      .sort()
      .forEach((key) => {
        if (key.toLowerCase().startsWith('x-ucloud')) {
          p.push(`${key.toLowerCase()}:${getHeader(key)}`)
        }
      })
    p.push(`/${bucket}${key}`)
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
  if (typeof (file) !== 'string' && !Array.isArray(file)) {
    return;
  }
  [file].forEach((item) => {
    fs.unlink(item, () => {
      // console.log(item);
    })
  })
}