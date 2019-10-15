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
  // it('PrefixFileList', async function () {
  //   try {
  //     const res = await ufile.prefixFileList({
  //       // prefix: 'smile-blog',
  //       // limit:1,
  //       // marker:'about.png'
  //     })
  //     res.body['DataSet'].should.be.Array()
  //     // console.log(res.body);
  //   } catch (error) {
  //     console.error(error.response.body)
  //     // console.error(e.response.req._headers)
  //     throw error
  //   }
  // })

  // it('PutFile', async function () {
  //   try {
  //     const file_prefix = 'smile-blog';
  //     const file_path = './img/about.png';
  //     const res = await ufile.putFile({ file_path, file_prefix });
  //     res.should.be.Object().and.has.properties(['code', 'url']);
  //     console.log(res);
  //   } catch (error) {
  //     throwError(error)
  //   }
  // })
  // it('GetFile', async function () {
  //   try {
  //     const key = 'smile-blog/Sophi.JPG';
  //     const file_save_dir = './download';
  //     const res = await ufile.getFile({ key});
  //     res.should.be.Object().and.has.properties(['code', 'path']);
  //     console.log(res);
  //   } catch (error) {
  //     throwError(error)
  //   }
  // })
  it('TransferFile', async function () {
    try {
      const originUrl = 'https://charbo.me/images/blogImg';
      const target_file_prefix = 'smile-blog';
      const bucket = 'charbo-assets';
      const keyArr = Array.from({ length: 3 }, (value, index) => {
        return `ckxt${index + 1}.jpg`
      });
      const res = await new UFile({ bucket }).transferFile({ keyArr, originUrl, target_file_prefix });
      res.should.be.Array().and.match(/^http/);
      console.log(res);
    } catch (error) {
      throwError(error)
    }
  })

})

// (async () => {
//   try {
//     const key = 'asdasd';
//     const file = './img/about.png';
//     const res = await ufile.putFile({ key, file })
//     console.log(`test res: ${res}`);
//   } catch (error) {
//     console.log(error)

//   }
// })()
const throwError = (error) => {
  if (error instanceof Error) {
    throw (error)
  } else {
    throw (new Error(JSON.stringify(error)))
  }
}
