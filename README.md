# ufile-rest
ufile官方的node sdk实现比较悲惨……

接口参数和返回参考<https://docs.ucloud.cn/api/ufile-api/index>

<a name="UFile"></a>

## UFile
**Kind**: global class  

* [UFile](#UFile)
    * [new UFile(pubKey, priKey, bucketName, domain, useHttps)](#new_UFile_new)
    * [.prefixFileList([prefix], [marker], [limit])](#UFile+prefixFileList) ⇒ <code>Promise</code>
    * [.putFile(key, file, [mimeType])](#UFile+putFile) ⇒ <code>Promise</code>
    * [.uploadHit(hash, fileName, fileSize)](#UFile+uploadHit) ⇒ <code>Promise</code>
    * [.getFile(key, [range], [ifModifiedSince])](#UFile+getFile) ⇒ <code>Promise</code>
    * [.headFile(key)](#UFile+headFile) ⇒ <code>Promise</code>
    * [.deleteFile(key)](#UFile+deleteFile) ⇒ <code>Promise</code>
    * [.initiateMultipartUpload(key)](#UFile+initiateMultipartUpload) ⇒ <code>Promise</code>
    * [.uploadPart(key, uploadId, partNumber, buffer)](#UFile+uploadPart) ⇒ <code>Promise</code>
    * [.finishMultipartUpload(key, uploadId, [newKey], parts)](#UFile+finishMultipartUpload) ⇒ <code>Promise</code>
    * [.abortMultipartUpload(key, uploadId)](#UFile+abortMultipartUpload) ⇒ <code>Promise</code>
    * [.getMultiUploadId([prefix], [marker], [limit])](#UFile+getMultiUploadId) ⇒ <code>Promise</code>
    * [.getMultiUploadPart(uploadId)](#UFile+getMultiUploadPart) ⇒ <code>Promise</code>
    * [.opMeta(key, mimeType)](#UFile+opMeta) ⇒ <code>Promise</code>

<a name="new_UFile_new"></a>

### new UFile(pubKey, priKey, bucketName, domain, useHttps)
UFile SDK


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| pubKey | <code>string</code> |  | api公钥 |
| priKey | <code>string</code> |  | api私钥 |
| bucketName | <code>string</code> |  | 存储空间名 |
| domain | <code>string</code> |  | 存储空间域名 |
| useHttps | <code>boolean</code> | <code>false</code> | 是否使用https |

<a name="UFile+prefixFileList"></a>

### uFile.prefixFileList([prefix], [marker], [limit]) ⇒ <code>Promise</code>
前缀列表查询

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| [prefix] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | 前缀，utf-8编码，默认为空字符串 |
| [marker] | <code>string</code> | <code>&quot;&#x27;&#x27;&quot;</code> | 标志字符串，utf-8编码，默认为空字符串 |
| [limit] | <code>number</code> | <code>20</code> | 文件列表数目，默认为20 |

<a name="UFile+putFile"></a>

### uFile.putFile(key, file, [mimeType]) ⇒ <code>Promise</code>
上传文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| key | <code>string</code> |  |  |
| file | <code>Buffer</code> \| <code>Stream.Readable</code> \| <code>string</code> |  | 文件 |
| [mimeType] | <code>string</code> | <code>&quot;&#x27;application/octet-stream&#x27;&quot;</code> | 文件类型 |

<a name="UFile+uploadHit"></a>

### uFile.uploadHit(hash, fileName, fileSize) ⇒ <code>Promise</code>
秒传文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| hash | <code>string</code> | 待上传文件的ETag,详见ETag生成文档 |
| fileName | <code>string</code> | Bucket中文件的名称 |
| fileSize | <code>string</code> | 待上传文件的大小 |

<a name="UFile+getFile"></a>

### uFile.getFile(key, [range], [ifModifiedSince]) ⇒ <code>Promise</code>
下载文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type | Description |
| --- | --- | --- |
| key | <code>string</code> | key |
| [range] | <code>string</code> | 分片下载的文件范围 |
| [ifModifiedSince] | <code>string</code> | 只返回从某时修改过的文件，否则返回304(not modified) |

<a name="UFile+headFile"></a>

### uFile.headFile(key) ⇒ <code>Promise</code>
查询文件基本信息

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

<a name="UFile+deleteFile"></a>

### uFile.deleteFile(key) ⇒ <code>Promise</code>
删除文件

**Kind**: instance method of [<code>UFile</code>](#UFile)  

| Param | Type |
| --- | --- |
| key | <code>string</code> | 

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

