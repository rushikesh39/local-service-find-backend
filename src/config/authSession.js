const session=require('express-session')
const {MongoStore}=require('connect-mongo')

const authSession=session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:false,
    store:MongoStore.create({mongoUrl:process.env.MONGO_URI}),
    rolling:true,
    cookie:{maxAge:1000*60*60*24*7}
})

module.exports=authSession