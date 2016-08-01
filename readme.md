Mysql-batch
---
批量更新数据库，Update and Insert

### Install
```sh
npm i mysql-batch --save
```

Test Data
```json
[
    [
        "1000",
        "1",
        "爱星座",
        "1",
        "1",
        "2",
        "2",
        "3",
        "3"
    ],
    [
        "1001",
        "1",
        "爱电影",
        "1",
        "1",
        "2",
        "2",
        "3",
        "3"
    ],
    [
        "abc",
        "1",
        "爱直播",
        "1",
        "1",
        "2",
        "2",
        "3",
        "3"
    ],
    [
        "1003",
        "",
        "爱游戏",
        "1",
        "1",
        "2",
        "2",
        "3",
        "3"
    ]
]
```

### Usage
```js
var db = require('./db');
var Batch = require('mysql-batch');

var header = [
    "list_id",
    "status",
    "memo",
    "text1",
    "url1",
    "text2",
    "url2",
    "text3",
    "url3"
]

var batch = new Batch({
    // 主键，用于断定 Update or Insert
    key: 'list_id',
    // 表名
    name: 'table_name',
    // 数据对应字段名
    header: header,
    // 需要检查的必须字段
    required: [
        'list_id',
        'status'
    ],
    // mysql连接池
    db: require('./db')
})

batch
    .get(data)
    // [[]] => [{}]
    // 数据结构更新
    .pipe(batch.parse())
    // 过滤不符合条件的数据
    .pipe(batch.filter())
    // [{}] => [{ sql }]
    // 数据结构更新，格式化sql语句
    .pipe(batch.format())
    // ==> db
    // 更新数据库
    // @err     app级错误信息
    // @sure	成功的信息
    // @fail	失败的信息
    // @filter  被过滤的信息
    .dest((err, sure, fail, filter) => {
        console.log(sure)
        console.log(fail)
        console.log(filter)
        console.log('done')
    })
```

Term Log
```js
[ { code: 0, type: 'update', key: '1000' },
  { code: 0, type: 'insert', key: '1001' } ]
[ { code: 1,
    type: 'insert',
    msg: 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: Incorrect integer value: \'abc\' for column \'list_id\' at row 1',
    err: [Error Object],
    key: 'abc' } ]
[ { code: 2,
    type: 'filter',
    msg: '缺少关键字段',
    required: [ 'list_id', 'status' ] } ]
done
```
