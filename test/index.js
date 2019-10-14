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
  this.timeout(20000);
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
  it('PutFile', async function () {
    try {
      const key = 'asdasd';
      const file = './img/about.png';
      const res = await ufile.putFile({ key, file })
      res.should.be.Object().and.has.property('code', 1);    
      console.log('  test result: ',res);
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
