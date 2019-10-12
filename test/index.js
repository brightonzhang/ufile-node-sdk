/**
 * Created by bangbang93 on 2017/9/13.
 */
'use strict';
require('should');
const path = require('path')
const UFile = require('../')

const config = require(path.resolve(process.cwd(), './ufile-config'));


const ufileBucket = new UFile.Bucket(config)

const ufile = new UFile(config)

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
