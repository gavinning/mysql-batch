/**
 * 批量更新数据库
 * @author gavinning
 * @date 2016-08-01
 * @homepage https://github.com/gavinning/mysql-batch.git
 */

class Batch {

    constructor(options) {
        this.Fail = [];
        this.Sure = [];
        this.Filter = [];
        this.db = options.db;
        this.Key = options.key;
        this.Name = options.name;
        this.Header = options.header;
        this.Required = options.required || [];
        this.Required.includes(this.Key) || this.Required.push(this.Key);
        this.QUERY = 'Select * from ?? where ?? = ?';
        this.INSERT = 'Insert into ?? SET ?';
        this.UPDATE = 'Update ?? SET ? where ?? = ?';
    }

    get(data) {
        this.Source = data;
        return this;
    }

    pipe(data) {
        this.Source = data;
        return this;
    }

    /* this.Source 数据结构变更
       三维数组 => 二维数组[Object]
        [
             [
                 item
             ]
        ]
        ==>
        [
             {
                 key: value
             }
        ]
     */
    parse() {
        return this.Source.map(item => {
            let obj = {};
            this.Header.forEach((key, i) => {
                obj[key] = item[i]
            })
            return obj
        })
    }

    // 过滤不符合this.Required条件的信息
    filter() {
        return this.Source.filter(item => {
            return this.Required.every(key => item[key]) ? true :
                this.Filter.push({
                    code: 2,
                    type: 'filter',
                    msg: '缺少关键字段',
                    required: this.Required
                }).length;
        })
    }

    /* this.Source 数据结构变更
        [
             {@item
                 key: value
             }
        ]
        ==>
        [
            {
                data: @item,
                query: promise sql,
                insert: promise sql,
                update: promise sql
            }
        ]
     */
    format() {
        return this.Source.map(item => {
            return {
                data: item,
                query: this.getQuery(item),
                insert: this.getInsert(item),
                update: this.getUpdate(item)
            }
        })
    }

    makePromise(args, item, type) {
         return new Promise((res, rej) => {
            type === 'query' ?
            args.push((err, docs) => {
                err ? res([]) : res(docs)
            }):
            args.push((err, docs) => {
                err ?
                    res({
                        code: 1,
                        type: type,
                        msg: err.message,
                        err: err,
                        key: item.data[this.Key]
                    }):
                    res({
                        code: 0,
                        type: type,
                        key: item.data[this.Key]
                    })
            })
            this.db.query(args[0], args[1], args[2])
        })
    }

    getQuery(data) {
        return [this.QUERY, [this.Name, this.Key, data[this.Key]]]
    }

    getInsert(data, fn) {
        return [this.INSERT, [this.Name, data]]
    }

    getUpdate(data, fn) {
        return [this.UPDATE, [this.Name, data, this.Key, data[this.Key]]]
    }

    dest(fn) {
        this.Source.forEach(item => {
            this.makePromise(item.query, item, 'query')
                .then(docs => {
                    return docs.length ?
                        this.makePromise(item.update, item, 'update'):
                        this.makePromise(item.insert, item, 'insert');
                })
                .then(data => {
                    data.code === 0 && this.Sure.push(data);
                    data.code === 1 && this.Fail.push(data);
                    if(this.Sure.length + this.Fail.length === this.Source.length){
                        !fn || fn(null, this.Sure, this.Fail, this.Filter)
                    }
                })
                .catch(err => {
                    !fn || fn(err)
                    console.log(err, 'db/batch|177')
                })
        })
    }
}

module.exports = Batch;
