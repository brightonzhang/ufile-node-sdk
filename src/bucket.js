const request = require('superagent')
const crypto = require('crypto')
const pascalCase = require('pascal-case')

class UFileBucket {
  /**
   * UFileBucket SDK
   * @param {string} publicKey api公钥
   * @param {string} privateKey api私钥
   */
  constructor ({publicKey, privateKey}) {
    this._publicKey = publicKey
    this._privateKey = privateKey
  }


  getProjectList({resourceCount, memberCount}) {
    return this._request({
      url: 'https://api.ucloud.cn/usub_account',
      query: {
        action: 'GetProjectList',
        resourceCount,
        memberCount
      }
    })
  }

  /**
   * 创建Bucket
   * @param {string} bucket 待创建Bucket的名称，具有全局唯一性
   * bucket参数将构成域名的一部分(与Bucket默认关联的域名为<bucket>.ufile.ucloud.cn)，必须具有全局唯一性。
   * bucket参数必须符合Bucket名称规范,规范如下:
   * 1. 长度在3~63字节之间
   * 2. 可以由多个标签组成，各个标签用 . 间隔，每个标签只能包含小字母、数字、连接符（短横线），并且标签的开头和结尾的字符只能是小写字母或数字
   * 3. 不可以是IP地址。
   * @param {string} [type=private] Bucket访问类型，public或private; 默认为private
   * @param {string} region Bucket所属地域，默认北京
   * @param {string} [projectId] 项目ID
   * @returns {Promise}
   */
  createBucket({bucket, type, region, projectId}) {
    return this._request({body: {action: 'CreateBucket', bucket, type, region, projectId}})
  }

  /**
   * 获取Bucket信息
   * @param {string} [bucket] 待获取Bucket的名称，若不提供，则获取所有Bucket
   * @param {number} [offset] 获取所有Bucket列表的偏移数目，默认为0
   * @param {number} [limit] 获取所有Bucket列表的限制数目，默认为20
   * @param {string} [projectId] 项目ID
   * @returns {Promise}
   */
  describeBucket({bucket, offset, limit, projectId}) {
    return this._request({body: {action: 'DescribeBucket', bucket, offset, limit, projectId}})
  }

  /**
   * 更改Bucket属性
   * @param {string} bucket 待修改Bucket的名称
   * @param {string} type Bucket访问类型
   * @param {string} [projectId] 项目id
   * @returns {Promise}
   */
  updateBucket({bucket, type, projectId}) {
    return this._request({body: {action: 'UpdateBucket', bucket, type, projectId}})
  }

  /**
   * 删除Bucket
   * @param {string} bucket 待删除Bucket的名称
   * @param {string} [projectId] 项目id
   * @returns {Promise}
   */
  deleteBucket({bucket, projectId}) {
    return this._request({body: {action: 'DeleteBucket', bucket, projectId}})
  }

  /**
   * 购买配额
   * QuotaType和Quota参数限制说明如下：
   * 1. storage-volome的单位为GB*天，Quota取值范围为 [100, 30 000 000]，且Quota是100的倍数；
   * 2. download-traffic的单位为GB，Quota取值范围为 [1, 102 400]；
   * 3. request-count的单位为万次，Quota取值范围为 [1, 1 000 000]
   * @param {string} quotaType 配额类型，取值为storage-volume, download-traffic或request-count
   * @param {string} region 配额所属地域，默认为北京
   * @param {int} quota 配额数值
   * @param {string} [couponId] 代金券编号
   * @param {string} [projectId] 项目ID
   * @returns {Promise}
   */
  buyUFileQuota({quotaType, region, quota, couponId, projectId}) {
    return this._request({query: {
      action: 'BuyUFileQuota',
      quotaType,
      region,
      quota,
      couponId,
      projectId,
    }})
  }

  /**
   * 查看配额状态
   * @param {string} quotaType 配额类型，取值为storage-volume, download-traffic或request-count
   * @param {string} [projectId] 项目id
   * @returns {Promise}
   */
  getUFileQuota({quotaType, projectId}) {
    return this._request({
      query: {
        action: 'GetUFileQuota',
        quotaType,
        projectId,
      }
    })
  }

  /**
   * 查询配额支付价格
   * @param {string} region 配额所属地域，默认为北京
   * @param {number} [storageVolume] 存储容量，单位: GB天，范围: [0, 30 000 000]，步长：100GB天
   * @param {number} [downloadTraffic] 下载流量，单位: GB，范围: [0, 60 000]，步长：1GB
   * @param {number} [requestCount] 请求次数，单位：万次，范围：[0, 1 000 000]，步长：1万次
   * @returns {Promise}
   */
  getUFileQuotaPrice({region, storageVolume, downloadTraffic, requestCount}) {
    return this._request({
      query: {
        action: 'GetUFileQuotaPrice',
        region,
        storageVolume,
        downloadTraffic,
        requestCount
      }
    })
  }

  /**
   * 查看配额使用报表
   * @param {string} region 所查询UFile使用报告的所属地域，默认为北京
   * @param {number} startTime unix时间戳，查询开始时间
   * @param {number} endTime Unix时间戳，查询结束时间
   * @param {string} [projectId] 项目id
   * @returns {Promise}
   */
  getUFileReport({region, startTime, endTime, projectId}) {
    return this._request({
      query: {
        action: 'GetUFileReport',
        region,
        startTime,
        endTime,
        projectId,
      }
    })
  }

  /**
   * 获取配额信息
   * @param {string} region 可用地域
   * @param {array.<string>} quotaType 配额类型，取值为storage-volume, download-traffic或request-count
   * @param {string} [projectId] 项目ID
   * @returns {Promise}
   */
  getUFileQuotaInfo({region, quotaType, projectId}) {
    const quotaTypes = {}
    quotaType.forEach((e, i) => {
      quotaTypes[`QuotaTypes.${i}`] = e
    })
    return this._request({
      query: {
        action: 'GetUFileQuotaInfo',
        region,
        projectId,
        ...quotaTypes
      }
    })
  }

  _sign(params) {
    const signStr = Object.keys(params)
      .sort()
      .reduce((r, key) => {
        return r + key + params[key]
      }, '') + this._privateKey
    return sha1(signStr)
  }

  async _request({url, query, body, method = 'get', headers}) {
    url = url || 'https://api.ucloud.cn'
    const req = request(method, url)
    if (headers) {
      req.set(headers)
    }
    switch (method.toLowerCase()) {
      case 'post':
      case 'put':
      case 'patch':
        body           = pascalObject(body)
        body.PublicKey = this._publicKey
        body.Signature = this._sign(body)
        req.send(body)
        break
      default:
        query           = pascalObject(query)
        query.PublicKey = this._publicKey
        query.Signature = this._sign(query)
        break
    }
    if (query) req.query(query)
    return req
  }
}

module.exports = UFileBucket

function pascalObject(obj) {
  const r = {};
  Object.keys(obj)
    .forEach((key) => {
      r[pascalCase(key)] = obj[key]
    })
  return r
}

function sha1(str, digest = 'hex') {
  return crypto.createHash('sha1').update(str).digest(digest)
}
