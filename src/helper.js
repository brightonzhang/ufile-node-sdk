const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pascalCase = require('pascal-case');
const mime = require('mime');
const shortid = require('shortid');
const _ = require('lodash');
const chalk = require('chalk');


const getEtag = async (filePath, fileSize = getFileSize(filePath)) => {
  assert(fileSize >= 0);
  if (fileSize <= 4 * 1024 * 1024) {
    try {
      let [cnt, sha1] = await _SmallSha1(filePath);
      let blkcnt = Buffer.alloc(4);
      blkcnt.writeUInt32LE(cnt, 0);
      const con = Buffer.concat([blkcnt, sha1]);
      const hash = _UrlsafeBase64Encode(con);
      return hash;
    } catch (error) {
      throwError(error)
    }
  } else {
    try {
      let [cnt, sha1] = await _ChunkSha1(filePath);
      let blkcnt = Buffer.alloc(4);
      blkcnt.writeUInt32LE(cnt, 0);
      const con = Buffer.concat([blkcnt, sha1]);
      const hash = _UrlsafeBase64Encode(con);
      return hash;
    } catch (error) {
      throwError(error)
    }
  }
}


const _SmallSha1 = (filePath) => {
  return new Promise((resolve, reject) => {
    try {
      let sha1 = crypto.createHash('sha1');
      const readStream = fs.createReadStream(filePath);
      readStream.on('data', (chunk) => {
        sha1.update(chunk);
      });
      readStream.on('end', () => {
        resolve([1, sha1.digest()]);
      });
    } catch (error) {
      reject(error)
    }
  });
}

const _ChunkSha1 = (filePath) => {
  const block_size = 4 * 1024 * 1024;
  return new Promise((resolve, reject) => {
    try {
      let sha1 = crypto.createHash('sha1');
      let g_sha1 = crypto.createHash('sha1');
      let block = 0;
      let count = 0;

      const readStream = fs.createReadStream(filePath);
      readStream.on('data', (chunk) => {
        block += chunk.length;
        sha1.update(chunk);
        if (block == block_size) {
          g_sha1.update(sha1.digest());
          sha1 = crypto.createHash('sha1');
          block = 0;
          count++;
        }
      });
      readStream.on('end', () => {
        if (block > 0) {
          g_sha1.update(sha1.digest());
          count++;
        }
        resolve([count, g_sha1.digest()]);
      });
    } catch (error) {
      reject(error)
    }
  });

}
const _UrlsafeBase64Encode = function (buf) {
  const encoded = buf.toString('base64');
  return _Base64ToUrlSafe(encoded);
}

const _Base64ToUrlSafe = function (value) {
  return value.replace(/\//g, '_').replace(/\+/g, '-');
}



const hmacSha1 = (str, privateKey, digest = 'base64') => {
  return crypto.createHmac('sha1', privateKey).update(str).digest(digest)
}

const pascalObject = (obj) => {
  const r = {};
  Object.keys(obj)
    .forEach((key) => {
      r[pascalCase(key)] = obj[key]
    })
  return r
}

const getMimeType = (filePath) => {
  const ret = mime.getType(filePath);
  if (!ret) {
    return "application/octet-stream";
  }
  return ret;
}

const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return stats.size;
}
const getKey = (filePath, prefix = '', fileRename, unique) => {
  filePath = filePath.replace(/\\/g, "/");
  prefix = !prefix || prefix.endsWith('/') ? prefix : prefix + '/';
  fileRename = fileRename ? `${fileRename}${fileRename.indexOf('.') !== -1 ? '' : path.extname(filePath)}`
    : path.basename(filePath);
  let key = prefix + fileRename;
  if (unique) {
    const id = (_.isString(unique) || _.isNumber(unique)) ? unique : shortid.generate();
    const keyArr = key.split('.');
    key = `${keyArr[0]}_${id}.${keyArr[keyArr.length - 1]}`;
  }
  return key;
}
const unlinkFile = (file) => {
  // console.log(chalk.bgRed(file));
  if (_.isString(file) && _.trim(file) !== '') {
    file = [file]
  } else if (!_.isArray(file)) {
    console.log(chalk.yellow(`  Error while unlinking file: Invalid file path`))
    return;
  }
  let deleteTask = [];
  file.forEach((item) => {
    const deletePromise = new Promise((resolve, reject) => {
      fs.unlink(item, (error) => {
        error && console.log(chalk.yellow(`  Error while unlinking file: ${error.code}`))
        resolve()
      })
    })
    deleteTask.push(deletePromise);
  })
  return Promise.all(deleteTask);
}
const throwError = (error) => {
  if (_.isError(error)) {
    throw (error)
  } else {
    throw (new Error(JSON.stringify(error)))
  }
}

module.exports = {
  getEtag,
  hmacSha1,
  pascalObject,
  getKey,
  getMimeType,
  getFileSize,
  unlinkFile,
  throwError
}