/*
module.exports = function (app) {
    app.get('/',function (req,res) {
        res.render('index',{
          title:'Express'
        })
    })
}*/
//加密模块
var crypto = require('crypto');
//User对象的操作类
var User = require('../models/user');
//Post对象操作类
var Post = require('../models/post');
//Comment对象操作类
var Comment = require('../models/comment');
//引入multer插件
var multer = require('multer');
//配置一下multer的参数
var storage = multer.diskStorage({
    destination:function (req,file,cb) {
        //文件存放的地址
        cb(null,'./public/images')
    },
    //文件的命名
    filename:function (req,file,cb) {
        cb(null,file.originalname)
    }
});
//应用此配置
var upload = multer({
    storage:storage
});
function checkNotLogin(req,res,next) { //中间件
    if(req.session.user){
        //用户已经登录了
        req.flash('error','不能重复登录');
        res.redirect('back');//跳转到之前的页面
    }
    next();
}
function checkLogin(req,res,next) {
    if(!req.session.user){
        //未登录21
        req.flash('error','请先登录');
        res.redirect('back');
    }
    next();
}
module.exports = function (app) {
    //首页的路由
    app.get('/',function (req,res) {
        //如果有参数传递(page当前页数),就使用参数作为当前页数,如果没有,就是第一页
        var page = parseInt(req.query.page) || 1;
        Post.getTen(null,page,function (err,posts,total) {
            if(err){
                posts = [];
            }
            res.render('index',{
                title:'首页',
                posts:posts,
                //当前页数
                page:page,
                //总条数
                total:total,
                //判断它是否为第一页
                isFirstPage:(page - 1) == 0,
                //判断它是否是最后一页
                isLastPage:((page - 1) * 3 + posts.length) == total,
                user:req.session.user,//注册成功的用户信息
                success:req.flash('success').toString(),//成功的提示信息
                error:req.flash('error').toString()//失败的提示信息
            })
        })
    });
    ///注册页面
    app.get('/reg',checkNotLogin,function (req,res) {
        res.render('reg', {
            title:"注册",
            user:req.session.user,//注册成功的用户信息
            success:req.flash('success').toString(),//成功的提示信息
            error:req.flash('error').toString()//失败的提示信息
        })
    });
    //注册行为
    app.post('/reg',checkNotLogin,function (req,res) {
        //收集一下post请求发过来的注册用户的用户名/密码/邮箱
        var name = req.body.name;
        var password = req.body.password;
        var password_re = req.body['password-repeat'];
        var email = req.body.email;
        /*console.log(name);
        console.log(password);
        console.log(email);*/
        //1.检查密码是否一致
        if(password != password_re){
            //给出错误提示
            req.flash('error','两次密码输入不一致');
            //返回到注册页面
            return res.redirect('/reg');
        }
        //2.对密码进行加密
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //console.log(password);
        //3.实例化User类,赋值
        var newUser = new User({
            name:name,
            password:password,
            email:email
        });
        //检查用户名在数据库中是否已经存在了,如果已经存在了,用户是不能注册了
        User.get(newUser.name,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect('/reg');
            }
            //用户名重复了
            if(user){
                req.flash('error','用户名不能重复');
                return res.redirect('/reg');
            }
            //保存到数据库中去
            newUser.save(function (err,user) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                //将用户名的信息保存到session中去
                req.session.user = newUser;
                req.flash('success','注册成功');
                return res.redirect('/');
            })
        })
    });
    //登录页面
    app.get('/login',checkNotLogin,function (req,res) {
        res.render('login',{
            title:"登录",
            user:req.session.user,//注册成功的用户信息
            success:req.flash('success').toString(),//成功的提示信息
            error:req.flash('error').toString()//失败的提示信息
        })
    });
    //登录行为
    app.post('/login',checkNotLogin,function (req,res) {
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        //1.检查用户名是否一样
        User.get(req.body.name,function (err,user) {
            if(err){
                req.flash('error',err);
                return res.redirect('/login');
            }
            if(!user){
                req.flash('error','用户名不存在');
                return res.redirect('/login');
            }
            //判断密码是否一样,如果不一样,提示输入密码错误
            if(user.password != password){
                req.flash('error','密码输入错误');
                return res.redirect('/login')
            }
            //成功后,将用户信息存放人session中,保存,保存提示登录成功,跳转首页
            req.session.user = user;
            req.flash('success','登录成功');
            return res.redirect('/');
        })
    });
    //发表页面
    app.get('/post',checkLogin,function (req,res) {
        res.render('post',{
            title:"发表文章",
            user:req.session.user,//注册成功的用户信息
            success:req.flash('success').toString(),//成功的提示信息
            error:req.flash('error').toString()//失败的提示信息
        })
    });
    //发表行为
    app.post('/post',checkLogin,function (req,res) {
        //当前登录的用户信息
        var currentUser = req.session.user;
        var tags = [req.body.tag1,req.body.tag2,req.body.tag3];
        var post = new Post(currentUser.name,req.body.title,tags,req.body.post);
        post.save(function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('/post')
            }
            req.flash('success','发表成功');
            return res.redirect('/')
        })
    });
    //退出
    app.get('/logout',checkLogin,function (req,res) {
        req.session.user = null;
        req.flash('success','退出成功');
        return res.redirect('/');
    });
    //文件上传的页面
    app.get('/upload',checkLogin,function (req,res) {
        res.render('upload',{
            title:"文件上传",
            user:req.session.user,
            success:req.flash('success').toString(),
            error:req.flash('error').toString()
        })
    });
    //文件上传的行为
    app.post('/upload',checkLogin,upload.array('field1',5),function (req,res) {
        req.flash('success','文件上传成功');
        res.redirect('/upload')
    });
    //用户发表的所有文章
    app.get('/u/:name',function (req,res) {
        //1.先获取到要查询的用户姓名
        var name = req.params.name;
        //获取当前传递的页数
        var page = parseInt(req.query.page) || 1;
        //2.查询用户名是否存在
        User.get(name,function (err,user) {
            if(err){
                req.flash('error','该用户名不存在');
                return res.redirect('/')
            }
            //3.查询该用户下的所有文章
            Post.getTen(user.name,page,function (err,posts,total) {
                if(err){
                    req.flash('error',err);
                    return res.redirect('/')
                }
                res.render('user',{
                    title:user.name,
                    user:req.session.user,
                    page:page,
                    total:total,
                    currentpage:Math.ceil(total / 4),
                    isFirstPage:(page - 1) == 0,
                    isLastPage:((page - 1) * 3 + posts.length) == total,
                    success:req.flash('success').toString(),
                    error:req.flash('error').toString(),
                    posts:posts
                })
            })
        })
    });
    //文章的详情页面
    app.get('/u/:name/:minute/:title',function (req,res) {
        Post.getOne(req.params.name,req.params.minute,req.params.title,function (err,post) {
            if(err){
                req.flash('error',err);
                return res.redirect('/')
            }
            res.render('article',{
                title:post.title,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                post:post
            })
        })
    });
    //编辑页面
    app.get('/edit/:name/:minute/:title',checkLogin,function (req,res) {
        var currentUser = req.session.user;//session保存的是登录的用户信息
        Post.edit(currentUser.name,req.params.minute,req.params.title,function (err,post) {
            if(err){
                req.flash('error',err);
                return res.redirect('back')
            }
            res.render('edit',{
                title:post.title,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                post:post
            })
        })
    });
    //编辑行为
    app.post('/edit/:name/:minute/:title',checkLogin,function (req,res) {
        Post.update(req.params.name,req.params.minute,req.params.title,req.body.post,function (err) {
            var url = encodeURI('/u/'+req.params.name+'/'+req.params.minute+'/'+req.params.title);
            if(err){
                req.flash('error',err);
                return res.redirect(url)
            }
            req.flash('success','编辑成功');
            return res.redirect(url)
        })
    });
    //删除行为
    app.get('/remove/:name/:minute/:title',function (req,res) {
        var currentUser = req.session.user;
        Post.remove(currentUser.name,req.params.minute,req.params.title,function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back')
            }
            req.flash('success','删除成功');
            return res.redirect('/')
        })
    });
    //留言的功能
    app.post('/comment/:name/:minute/:title',function (req,res) {
        var date = new Date();
        var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " +
            date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        //收集过来的整个留言所需要的字段数据
        var comment = {
            name:req.body.name,
            time:time,
            content:req.body.content
        };
        var newComment = new Comment(req.params.name,req.params.minute,req.params.title,comment);
        newComment.save(function (err) {
            if(err){
                req.flash('error',err);
                return res.redirect('back')
            }
            req.flash('success','留言成功');
            res.redirect('back')
        })
    });
    //存档的页面
    app.get('/archive',function (req,res) {
        Post.getArchive(function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/')
            }
            res.render('archive',{
                title:'存档页面',
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                posts:posts
            })
        })
    });
    //所有的标签页
    app.get('/tags',function (req,res) {
        Post.getTags(function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/')
            }
            res.render('tags',{
                title:'标签',
                user:req.session.user,
                posts:posts,
                success:req.flash('success').toString(),
                error:req.flash('error').toString()
            })
        })
    });
    //标签对应的文章列表
    app.get('/tags/:tag',function (req,res) {
        Post.getTag(req.params.tag,function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/')
            }
            res.render('tag',{
                title:'Tag:' + req.params.tag,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                posts:posts
            })
        })
    });
    //搜索的页面
    app.get('/search',function (req,res) {
        Post.search(req.query.keyword,function (err,posts) {
            if(err){
                req.flash('error',err);
                return res.redirect('/')
            }
            res.render('search',{
                title:req.query.search,
                user:req.session.user,
                success:req.flash('success').toString(),
                error:req.flash('error').toString(),
                posts:posts
            })
        })
    })
};
