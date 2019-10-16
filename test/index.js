const should = require('should');
const path = require('path');
const UFile = require('../src/index');
const UFileBucket = require('../src/bucket');

const config = require(path.resolve(process.cwd(), './ufile-config'));
const ufile = new UFile(config);


const RunTest = function () {
  this.timeout(5000);
  // it('PutFile', PutFile)
  // it('GetFile', GetFile)
  it('TransferFile', TransferFile)
  // it('PrefixFileList', PrefixFileList)
};

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
    console.log(`  Got ${res['DataSet'].length} result`);
    console.log(filenameArr);
  } catch (error) {
    throwError(error)
  }
}
const PutFile = async function () {
  try {
    const file_prefix = 'test';
    const file_path = './img/about.jpg';
    const res = await ufile.putFile({ file_path, file_prefix });
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
    const file_prefix = 'test';
    const urlArr = [
      {
        url: 'https://resource.shirmy.me/blog/covers/dark-line.jpg',
        file_prefix
      }, {
        url: 'https://resource.shirmy.me/blog/covers/category/coding-cover.jpg',
        file_prefix
      },
    ]
    const res = await new UFile({ bucket }).transferFile(urlArr);
    res.should.be.Array().and.match(/^http/);
    console.log(res);
  } catch (error) {
    throwError(error)
  }
}

describe('UFile SDK Test', RunTest)

const throwError = (error) => {
  if (error instanceof Error) {
    throw (error)
  } else {
    throw (new Error(JSON.stringify(error)))
  }
}
