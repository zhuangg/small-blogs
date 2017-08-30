/**
 * Created by Administrator on 2017-08-18.
 */
var mongo = require('./db');
//引入markdown
var markdown = require('markdown').markdown;
function Post(name,title,post) { //发表文章的用户名/文章标题/文章内容
    this.name = name;
    this.title = title;
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
    var post = {
        name:this.name,
        time:time,
        title:this.title,
        post:this.post
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
Post.getAll = function (name,callback) {
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
            collection.find(query).sort({time:-1}).toArray(function (err, docs) {
                mongo.close();
                if(err){
                    return callback(err)
                }
                //加入markdown解析
                docs.forEach(function (doc) {
                    doc.post = markdown.toHTML(doc.post);
                });
                callback(null,docs)
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
            collection.findOne({
                "name":name,
                "time.minute":minute,
                "title":title
            },function (err,doc) {
                mongo.close();
                if(err){
                    return callback(err);
                }
                //将这个文章内容进行markdown格式的解析
                doc.post = markdown.toHTML(doc.post);
                callback(null,doc)
            })
        })
    })
}