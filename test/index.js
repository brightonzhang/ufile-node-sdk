/**
 * Created by bangbang93 on 2017/9/13.
 */
'use strict';
const should = require('should');
const path = require('path');
const UFile = require('../src/index');
const UFileBucket = require('../src/bucket');

const config = require(path.resolve(process.cwd(), './ufile-config'));


const ufileBucket = new UFileBucket(config);

const ufile = new UFile(config);

describe('UFile SDK Test', function () {
  this.timeout(5000);
  it('PrefixFileList', async function () {
    try {
      const res = await ufile.getPrefixFileList({
        // prefix: 'smile-blog',
        // limit:1,
        // marker:'about.jpg'
      })
      res['DataSet'].should.be.Array();
      console.log(`  Got ${res['DataSet'].length} result`);
    } catch (error) {
      throwError(error)
    }
  })

  it('PutFile', async function () {
    try {
      const file_prefix = 'test';
      const file_path = './img/about.jpg';
      const res = await ufile.putFile({ file_path, file_prefix });
      res.should.be.Object().and.has.properties(['code', 'url']);
      console.log(res);
    } catch (error) {
      throwError(error)
    }
  })
  it('GetFile', async function () {
    try {
      const key = 'test/about.jpg';
      // const file_save_dir = './download';
      const res = await ufile.getFile({ key});
      res.should.be.Object().and.has.properties(['code', 'path']);
      console.log(res);
    } catch (error) {
      throwError(error)
    }
  })
  // it('TransferFile', async function () {
  //   this.timeout(50000);
  //   try {
  //     const bucket = 'charbo-assets';
  //     const file_prefix='smile-blog';
  //     const urlArr = [
  //       {
  //       url:'https://resource.shirmy.me/blog/covers/dark-line.jpg',
  //       file_prefix
  //     },{
  //       url:'https://resource.shirmy.me/blog/covers/category/coding-cover.jpg',
  //       file_prefix
  //     },
  //   ]
  //     const res = await new UFile({ bucket }).transferFile(urlArr);
  //     res.should.be.Array().and.match(/^http/);
  //     console.log(res);
  //   } catch (error) {
  //     throwError(error)
  //   }
  // })

})

const throwError = (error) => {
  if (error instanceof Error) {
    throw (error)
  } else {
    throw (new Error(JSON.stringify(error)))
  }
}
