/**
 * Created by bangbang93 on 2017/9/13.
 */
'use strict';
require('should');
const UFile = require('../')

const ufileBucket = new UFile.Bucket({
  pubKey: 'uHBkkj_l7DR_XaZVsTDjl_aBVWtM75qk6chz2N0q',
  priKey: 'DaAW_E3YCOIP8DHOAAJvHXa_n80mvHTuLCQ4hsfgHrpLxdW34HLoTmGDDkA6QOXw',
})

const ufile = new UFile({
  pubKey: 'uHBkkj_l7DR_XaZVsTDjl_aBVWtM75qk6chz2N0q',
  priKey: 'DaAW_E3YCOIP8DHOAAJvHXa_n80mvHTuLCQ4hsfgHrpLxdW34HLoTmGDDkA6QOXw',
  bucketName: 'charbo',
})

describe('UFile SDK Test', function () {
  it('GetProjectList', async function () {
    const resp = await ufileBucket.getProjectList({
      resourceCount: 'Yes',
      memberCount: 'Yes',
    })
    // console.log(resp.body)
    // console.log(resp.req)
    resp.body['RetCode'].should.eql(0)
  })
  it('PrefixFileList', async function () {
    try {
      const resp = await ufile.prefixFileList({
        // prefix: 'smile-blog',
        // limit:1,
        // marker:'about.png'
      })
      resp.body['DataSet'].should.be.Array()
      // console.log(resp.body);
    } catch (e) {
      console.error(e.response.body)
      // console.error(e.response.req._headers)
      throw e
    }
  })
})
