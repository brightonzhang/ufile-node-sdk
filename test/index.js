const should = require('should');
const path = require('path');
const UFile = require('../src/index');
const { throwError } = require('../src/helper');
const chalk = require('chalk');

const config = require(path.resolve(process.cwd(), './ufile-config.json'));
const ufile = new UFile(config);


const RunTest = function () {
  this.timeout(5000);
  // it('UploadHit', UploadHit);
  // it('PutFile', PutFile);
  // it('GetFile', GetFile);
  it('TransferFile', TransferFile);
  // it('HeadFile', HeadFile);
  // it('DeleteFile', DeleteFile);
  // it('PrefixFileList', PrefixFileList);

};
const HeadFile = async function () {
  try {
    const res = await ufile.headFile('test/about.jpg');
    res.should.be.Object().and.has.property('etag');
    // console.log(res);
  } catch (error) {
    throwError(error)
  }
}
const UploadHit = async function () {
  try {
    const filePath = './img/The-Slow-Dock.webm';
    const prefix = 'test';
    const fileRename = 'upload_hit';
    const res = await ufile.uploadHit({ filePath, prefix, fileRename });
    res.should.be.Object().and.has.properties(['code', 'url']);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}
const DeleteFile = async function () {
  try {
    const res = await ufile.deleteFile('test/about.jpg');
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
    const filePath = './img/about.jpg';
    const res = await ufile.putFile({ filePath, prefix });
    res.should.be.Object().and.has.properties(['code', 'url']);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}

const GetFile = async function () {
  try {
    const key = 'test/about.jpg';
    // const fileSaveDir = './download';
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
    const bucket = 'charbo-assets';
    const prefix = 'CBidea';
    const urlArr = [
      {
        url: 'https://charbo23.github.io/images/blogImg/ckxt1.jpg',
        prefix
      }
    ]
    const res = await new UFile({ bucket }).transferFile(urlArr);
    res.should.be.Array().and.match(/^http/);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}

describe('UFile SDK Test', RunTest);


