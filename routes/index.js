/*
module.exports = function (app) {
    app.get('/',function (req,res) {
        res.render('index',{
          title:'Express'
        })
    })
}*/
module.exports = function (app) {
    ///注册页面
    app.get('/',function (req,res) {
        res.render('/reg', {
            title:"首页"
        })
    })
    //注册行为
    app.post('/reg',function (req,res) {

    })
    //登录页面
    app.get('/login',function (req,res) {
        res.render('login',{
            title:"登录"
        })
    })
    //登录行为
    app.post('/login',function (req,res) {

    })
    //发表页面
    app.get('/post',function (req,res) {
        res.render('post',{
            title:"发表文章"
        })
    })
    //发表行为
    app.get('/logout',function (req,res) {

    })
    //退出
    app.get('/logout',function (req,res) {

    })
}