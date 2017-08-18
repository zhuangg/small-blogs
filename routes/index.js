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
        //未登录
        req.flash('error','请先登录');
        res.redirect('back');
    }
    next();
}
module.exports = function (app) {
    //首页的路由
    app.get('/',function (req,res) {
        res.render('index',{
            title:'首页',
            user:req.session.user,//注册成功的用户信息
            success:req.flash('success').toString(),//成功的提示信息
            error:req.flash('error').toString()//失败的提示信息
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

    });
    //退出
    app.get('/logout',checkLogin,function (req,res) {
        req.session.user = null;
        req.flash('success','退出成功');
        return res.redirect('/');
    })
}