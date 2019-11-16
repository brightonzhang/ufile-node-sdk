const should = require('should');
const path = require('path');
const UFile = require('../src/index');
const { throwError } = require('../src/helper');
const chalk = require('chalk');

const ufile = new UFile();


const RunTest = function () {
  this.timeout(5000);
  it('PutFile', PutFile);
  it('UploadHit', UploadHit);
  it('GetFile', GetFile);
  it('TransferFile', TransferFile);
  it('HeadFile', HeadFile);
  it('PrefixFileList', PrefixFileList);
  // it('DeleteFile', DeleteFile);
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
    const filePath = './img/about.jpg';
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
  this.timeout(20000);
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
    let dlpromises = [];
    const fileSaveDir = './download';
    const keyArr = [
      'test/about.jpg',
    ]
    keyArr.forEach((item) => {
      const promise = ufile.getFile({ key: item, fileSaveDir });
      dlpromises.push(promise);
    })
    const res = await Promise.all(dlpromises);
    // res.should.be.Array();
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}


const TransferFile = async function () {
  this.timeout(50000);
  try {
    const prefix = 'test';
    const urlArr = [
      {
        url: 'https://resource.shirmy.me/blog/covers/dark-line.jpg',
        prefix
      }
    ]
    const res = await ufile.transferFile(urlArr);
    res.should.be.Array().and.match(/^http/);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}


describe('UFile SDK Test', RunTest);


