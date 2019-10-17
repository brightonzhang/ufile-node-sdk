# ufile-node-sdk
ufile官方的Node SDK改进

(分片上传及bucket操作暂未实现，请勿使用)

接口参数和返回参考<https://docs.ucloud.cn/api/ufile-api/index>

<a name="UFile"></a>

## UFile
**Kind**: global class  

* [UFile](#UFile)
    * [new UFile(publicKey, privateKey, bucket, domain, protocol)](#new_UFile_new)
    * [.getPrefixFileList(prefix, marker, limit)](#UFile+getPrefixFileList) ⇒ <code>Promise</code>
    * [.uploadHit(hash, fileName, fileSize)](#UFile+uploadHit) ⇒ <code>Promise</code>
    * [.putFile(key, file_path, prefix, filename, unique)](#UFile+putFile) ⇒ <code>Object</code>
    * [.getFile(key)](#UFile+getFile) ⇒ <code>Object</code>
    * [.transferFile(urlArr)](#UFile+transferFile) ⇒ <code>Array</code>
    * [.headFile(key)](#UFile+headFile) ⇒ <code>Object</code>
    * [.deleteFile(key)](#UFile+deleteFile) ⇒ <code>Object</code>
    * [._sendRequest(url, method, headers, key, query, body)](#UFile+_sendRequest) ⇒ <code>request</code> \| <code>Promise</code>
    * [._sign(method, headers, bucket, key, body)](#UFile+_sign) ⇒ <code>request</code> \| <code>Promise</code>
    * [.initiateMultipartUpload(key)](#UFile+initiateMultipartUpload) ⇒ <code>Promise</code>
    * [.uploadPart(key, uploadId, partNumber, buffer)](#UFile+uploadPart) ⇒ <code>Promise</code>
    * [.finishMultipartUpload(key, uploadId, [newKey], parts)](#UFile+finishMultipartUpload) ⇒ <code>Promise</code>
    * [.abortMultipartUpload(key, uploadId)](#UFile+abortMultipartUpload) ⇒ <code>Promise</code>
    * [.getMultiUploadId([prefix], [marker], [limit])](#UFile+getMultiUploadId) ⇒ <code>Promise</code>
    * [.getMultiUploadPart(uploadId)](#UFile+getMultiUploadPart) ⇒ <code>Promise</code>
    * [.opMeta(key, mimeType)](#UFile+opMeta) ⇒ <code>Promise</code>

<a name="new_UFile_new"></a>

### new UFile(publicKey, privateKey, bucket, domain, protocol)
UFile SDK


| Param | Type | Description |
| --- | --- | --- |
| publicKey | <code>string</code> | api公钥 |
| privateKey | <code>string</code> | api私钥 |
| bucket | <code>string</code> | 存储空间名 |
| domain | <code>string</code> | 存储空间域名 |
| protocol | <code>boolean</code> | 网络协议头 |

<a name="UFile+getPrefixFileList"></a>

### uFile.getPrefixFileList(prefix, marker, limit) ⇒ <code>Promise</code>
前缀列表查询

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| prefix | <code>string</code> | 前缀，utf-8编码 |
| marker | <code>string</code> | 标志字符串，utf-8编码 |
| limit | <code>number</code> | 文件列表数目，默认为20 |

<a name="UFile+uploadHit"></a>

### uFile.uploadHit(hash, fileName, fileSize) ⇒ <code>Promise</code>
秒传文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| hash | <code>string</code> | 待上传文件的ETag,详见ETag生成文档 |
| fileName | <code>string</code> | Bucket中文件的名称 |
| fileSize | <code>string</code> | 待上传文件的大小 |

<a name="UFile+putFile"></a>

### uFile.putFile(key, file_path, prefix, filename, unique) ⇒ <code>Object</code>
上传文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>Object</code> - 状态码及上传成功的资源路径  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 文件key，会屏蔽prefix和filename |
| file_path | <code>string</code> | 待上传文件的路径 |
| prefix | <code>string</code> | 文件前缀 |
| filename | <code>string</code> | 文件名（若无后缀会自动加上后缀） |
| unique | <code>Boolean</code> \| <code>string</code> \| <code>Number</code> | 是否唯一，若传入ture则自动生成id，若传入Number或string则将其作为id |

<a name="UFile+getFile"></a>

### uFile.getFile(key) ⇒ <code>Object</code>
下载文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>Object</code> - 状态码及文件保存路径  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |

<a name="UFile+transferFile"></a>

### uFile.transferFile(urlArr) ⇒ <code>Array</code>
文件转移

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>Array</code> - 转移后的资源路径  

| Param | Type | Description |
| --- | --- | --- |
| urlArr | <code>Array</code> | 源文件链接数组，数组元素可为字符串或对象 |

<a name="UFile+headFile"></a>

### uFile.headFile(key) ⇒ <code>Object</code>
查询文件基本信息

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>Object</code> - API响应头  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="UFile+deleteFile"></a>

### uFile.deleteFile(key) ⇒ <code>Object</code>
删除文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>Object</code> - 状态码和状态信息  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="UFile+_sendRequest"></a>

### uFile.\_sendRequest(url, method, headers, key, query, body) ⇒ <code>request</code> \| <code>Promise</code>
发送请求

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>request</code> \| <code>Promise</code> - 状态码和状态信息  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | 请求的url，会屏蔽key |
| method | <code>string</code> | 请求方法 |
| headers | <code>string</code> | 请求头 |
| key | <code>string</code> | 请求key |
| query | <code>string</code> | 查询参数 |
| body | <code>string</code> | 请求体 |

<a name="UFile+_sign"></a>

### uFile.\_sign(method, headers, bucket, key, body) ⇒ <code>request</code> \| <code>Promise</code>
生成签名

**Kind**: instance method of [<code>UFile</code>](#UFile)  
**Returns**: <code>request</code> \| <code>Promise</code> - 状态码和状态信息  

| Param | Type | Description |
| --- | --- | --- |
| method | <code>string</code> | 请求方法 |
| headers | <code>string</code> | 请求头 |
| bucket | <code>string</code> | 资源bucket |
| key | <code>string</code> | 请求key |
| body | <code>string</code> | 请求体 |

<a name="UFile+initiateMultipartUpload"></a>

### uFile.initiateMultipartUpload(key) ⇒ <code>Promise</code>
初始化分片上传

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 文件名 |

<a name="UFile+uploadPart"></a>

### uFile.uploadPart(key, uploadId, partNumber, buffer) ⇒ <code>Promise</code>
上传分片

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 文件名 |
| uploadId | <code>string</code> | 分片id |
| partNumber | <code>number</code> | 第几块分片 |
| buffer | <code>buffer</code> | 内容 |

<a name="UFile+finishMultipartUpload"></a>

### uFile.finishMultipartUpload(key, uploadId, [newKey], parts) ⇒ <code>Promise</code>
完成分片

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 文件名 |
| uploadId | <code>string</code> | 分片id |
| [newKey] | <code>string</code> | 等上传完毕开始指定的key可能已经被占用,遇到这种情形时会采用newKey参数的值作为文件最终的key，否则仍然采用原来的key |
| parts | <code>array</code> | 分片的etag们 |

<a name="UFile+abortMultipartUpload"></a>

### uFile.abortMultipartUpload(key, uploadId) ⇒ <code>Promise</code>
放弃分片

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | 文件名 |
| uploadId | <code>string</code> | 分片id |

<a name="UFile+getMultiUploadId"></a>

### uFile.getMultiUploadId([prefix], [marker], [limit]) ⇒ <code>Promise</code>
获取正在执行的分片上传

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [prefix] | <code>string</code> |  | 前缀，utf-8编码，默认为空字符串 |
| [marker] | <code>string</code> |  | 标志字符串，utf-8编码，默认为空字符串 |
| [limit] | <code>number</code> | <code>20</code> | id列表数目，默认为20 |

<a name="UFile+getMultiUploadPart"></a>

### uFile.getMultiUploadPart(uploadId) ⇒ <code>Promise</code>
获取已上传成功的分片列表

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| uploadId | <code>string</code> | 上传id |

<a name="UFile+opMeta"></a>

### uFile.opMeta(key, mimeType) ⇒ <code>Promise</code>
操作文件的Meta信息

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |
| mimeType | <code>string</code> | 文件的mimetype |

