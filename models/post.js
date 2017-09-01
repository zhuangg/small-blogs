/**
 * Created by Administrator on 2017-08-18.
 */
var mongo = require('./db');
//引入markdown
var markdown = require('markdown').markdown;
function Post(name,title,tags,post) { //发表文章的用户名/文章标题/文章内容
    this.name = name;
    this.title = title;
    this.tags = tags;
    this.post = post;
}
module.exports = Post;
//保存文章
Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        //原始的格式
        date:date,
        //当前时间的年份
        year:date.getFullYear(),
        // 当前时间 年份 + 月份
        month:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' +
            (date.getMonth() + 1) : (date.getMonth() + 1)),
        // 当前时间 年份 + 月份 + 天
        day:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' +
            (date.getMonth() + 1) : (date.getMonth() + 1)) + '-' +
        (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()),
        //当前时间 年份 + 月份 + 天 + 小时 + 分钟 + 秒
        minute:date.getFullYear() + '-' + (date.getMonth() < 10 ? '0' +
            (date.getMonth() + 1) : (date.getMonth() + 1)) + '-' +
        (date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) +
        ' ' + (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) +
        ':' + (date.getMinutes() < 10 ? '0' + date.getMinutes():date.getMinutes()) +
        ':' + (date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
    };
    //把需要写入的数据全部放在post字段上
    var post = {
        name:this.name,
        time:time,
        title:this.title,
        tags:this.tags,
        post:this.post,
        //增加一个留言的字段
        comments:[],
        //增加一个留言的计数
        pv:0
    };
    //打开数据库
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            collection.insert(post,{safe:true},function (err, post) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                callback(null);
            })
        })
    })
};
//读取文章列表
Post.getTen = function (name,page,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            var query = {};
            if(name){
                query = {name:name}
            }
            collection.count(query,function (err,total) {
                collection.find(query,{
                    skip:(page-1)*3,
                    limit:3
                }).sort({time:-1}).toArray(function (err, docs) {
                    mongo.close();
                    if(err){
                        return callback(err)
                    }
                    //加入markdown解析
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    callback(null,docs,total)
                })
            })
        })
    })
};
//查询一篇文章
Post.getOne = function (name,minute,title,callback) {
    //1.打开数据库
    mongo.open(function (err,db) {
        if(err){
            return callback(err);
        }
        //2.读取posts集合
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err);
            }
            //根据用户名、发表日期及文章名进行查询
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function (err,doc) {
                if(err){
                    mongo.close();
                    return callback(err);
                }
                //当用户查询文章的时候,让它的PV字段+1
                if(doc){
                    collection.update({
                        "name":name,
                        "time.minute":minute,
                        "title":title
                    },{
                        $inc:{"pv":1}
                    },function (err) {
                        mongo.close();
                        if(err){
                            return callback(err)
                        }
                    })
                }
                //将这个文章内容进行markdown格式的解析
                doc.post = markdown.toHTML(doc.post);
                //让我们的留言也支持markdown格式
                doc.comments.forEach(function (comment) {
                    comment.content = markdown.toHTML(comment.content)
                });
                callback(null,doc)
            })
        })
    })
};
//编辑文章的方法
Post.edit = function (name,minute,title,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function (err,doc) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                callback(null,doc)//返回的是原始的格式,markdown格式的,没有解析
            })
        })
    })
};
//更新一篇文章
Post.update = function (name,minute,title,post,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            collection.update({
                "name":name,
                "time.minute":minute,
                "title":title
            },{
                $set:{post:post}
            },function (err) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                callback(null)
            })
        })
    })
};
//删除功能
Post.remove = function (name,minute,title,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            collection.remove({
                "name":name,
                "time.minute":minute,
                "title":title
            },{
                w:1
            },function (err) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                callback(null);
            })
        })
    })
};
//存档的方法
Post.getArchive = function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            collection.find({},{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                callback(null,docs)
            })
        })
    })
};
//返回所有的标签
Post.getTags = function (callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            //distinct 用来找出给定键的所有不同值
            collection.distinct('tags',function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                callback(null,docs)
            })
        })
    })
};
//返回一个标签对应的所有文章
Post.getTag = function (tag,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            //查询所有 tags 数组内包含tag的文档
            //并返回只含有 name、time、title 组成的数组
            collection.find({
                "tags":tag
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err, docs) {
                mongo.close();
                if (err) {
                    return callback(err);
                }
                callback(null, docs);
            })
        })
    })
};
//搜索
Post.search = function (keyword,callback) {
    mongo.open(function (err,db) {
        if(err){
            return callback(err)
        }
        db.collection('posts',function (err,collection) {
            if(err){
                mongo.close();
                return callback(err)
            }
            var reg = new RegExp(keyword,'i');
            collection.find({
                "title":reg
            },{
                "name":1,
                "time":1,
                "title":1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                callback(null,docs);
            })
        })
    })
};