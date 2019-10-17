const should = require('should');
const path = require('path');
const UFile = require('../src/index');
const { throwError, unlinkFile } = require('../src/helper');
const chalk = require('chalk');

const config = require(path.resolve(process.cwd(), './ufile-config'));
const ufile = new UFile(config);


const RunTest = function () {
  this.timeout(5000);
  // it('PutFile', PutFile);
  // it('GetFile', GetFile);
  // it('TransferFile', TransferFile);
  // it('HeadFile', HeadFile);
  // it('DeleteFile', DeleteFile);
  // it('PrefixFileList', PrefixFileList);
  // it('UploadHit', UploadHit);

};
const HeadFile = async function () {
  try {
    const res = await ufile.headFile(123);
    res.should.be.Object().and.has.property('etag');
    // console.log(res);
  } catch (error) {
    throwError(error)
  }
}
const UploadHit = async function () {
  try {
    const file_path = './img/The-Slow-Dock.webm';
    const prefix = 'test';
    const filename = 'upload_hit'
    const res = await ufile.uploadHit({ file_path, prefix, filename });
    res.should.be.Object().and.has.properties(['code','url']);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}
const DeleteFile = async function () {
  try {
    const res = await ufile.deleteFile(123);
    res.should.be.Object().and.has.properties(['code', 'msg']);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}
const PrefixFileList = async function () {
  try {
    const res = await ufile.getPrefixFileList({
      prefix: 'test',
      // limit:1,
      // marker:'about.jpg'
    })
    res['DataSet'].should.be.Array();
    const filenameArr = res['DataSet'].map((item) => {
      return item.FileName
    })
    const resLen = res['DataSet'].length;
    console.log(`  Got ${resLen} ${resLen > 1 ? 'results' : 'result'}`);
    console.log(filenameArr);
  } catch (error) {
    throwError(error)
  }
}
const PutFile = async function () {
  try {
    const prefix = 'test';
    const file_path = './img/about.jpg';
    const key = 123;
    const res = await ufile.putFile({ file_path, prefix, key });
    res.should.be.Object().and.has.properties(['code', 'url']);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}

const GetFile = async function () {
  try {
    const key = 'test/about.jpg';
    // const file_save_dir = './download';
    const res = await ufile.getFile({ key });
    res.should.be.Object().and.has.properties(['code', 'path']);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}
const TransferFile = async function () {
  this.timeout(50000);
  try {
    const bucket = 'charbo';
    const prefix = 'test';
    const urlArr = [
      {
        url: 'https://resource.shirmy.me/blog/covers/dark-line.jpg',
        prefix
      }, {
        url: 'https://resource.shirmy.me/blog/covers/category/coding-cover.jpg',
        prefix
      },
    ]
    const res = await new UFile({ bucket }).transferFile(urlArr);
    res.should.be.Array().and.match(/^http/);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}

describe('UFile SDK Test', RunTest);


