const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pascalCase = require('pascal-case');
const mime = require('mime');
const shortid = require('shortid');
const _ = require('lodash');
const chalk = require('chalk');

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
function getKey(file_path, file_prefix = '', filename, unique) {
  file_path = file_path.replace(/\\/g, "/");
  file_prefix = !file_prefix || file_prefix.endsWith('/') ? file_prefix : file_prefix + '/';
  filename = filename ? `${filename}${filename.indexOf('.') !== -1 ? '' : path.extname(file_path)}`
    : path.basename(file_path);
  let key = file_prefix + filename;
  if (unique) {
    const id = (_.isString(unique) || _.isNumber(unique)) ? unique : shortid.generate();
    const keyArr = key.split('.');
    key = `${keyArr[0]}_${id}.${keyArr[keyArr.length - 1]}`;
  }
  return key;
}
function unlinkFile(file) {
  if (_.isString(file)) {
    file = [file]
  } else if (!_.isArray(file)) {
    return;
  }
  let deleteTask = [];
  file.forEach((item) => {
    const deletePromise = new Promise((resolve, reject) => {
      fs.unlink(item, (error) => {
        error && console.log(chalk.yellow(`  Error while deleting file: ${error.code}`))
        resolve()
      })
    })
    deleteTask.push(deletePromise);
  })
  return Promise.all(deleteTask);
}
function throwError(error) {
  if (_.isError(error)) {
    throw (error)
  } else {
    throw (new Error(JSON.stringify(error)))
  }
}

module.exports = {
  hmacSha1,
  pascalObject,
  getKey,
  getMimeType,
  getFileSize,
  unlinkFile,
  throwError
}