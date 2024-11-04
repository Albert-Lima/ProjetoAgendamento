const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const path = require("path")
const app = express()

const passport = require("passport")
require("./config/passport.js")(passport)

//config
    //Banco de Dados (MongoDB/Mongoose)
    mongoose.connect("mongodb+srv://albertsousalima:albertlima123@sistemaagendamentos.2yg0i.mongodb.net/").then(()=>{
        console.log("conexão estabelecida com o MongoDB")
    }).catch(err=>{
        console.log("erro ao conectar com o MongoDB: "+err)
    })
    //Static Files
    app.use(express.static(path.join(__dirname,"public" )))
    //Template Engine(Handlebars)
    app.engine('handlebars', handlebars.engine(
        {defaultLayout: 'main',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true
        }}
    ))


    app.set("view engine", "handlebars")
    app.set('views',path.join(__dirname, 'views'))
    //BodyParser
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(bodyParser.json())

    //middlewares
    const session = require("express-session")
    const flash = require("connect-flash")

    app.use(session({
        secret: "192837465",
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    app.use(flash())
    app.use((req, res, next)=>{
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")

        res.locals.error = req.flash("error")
        res.locals.user = req.user || null

        next()
    })
    //passport para autenticação





//Routes
    //principal
    app.get("/", (req, res)=>{
        res.send("aqui será a página principal e terá uma LandingPage")
    })
    //Users
    const userRouter = require("./routes/user")
    app.use("/", userRouter)
    //Admin
    const adminRouter = require("./routes/admin")
    app.use("/", adminRouter)
    //auth
    const authRouter = require("./routes/auth")
    app.use("/", authRouter)

app.listen(8081, (err)=>{
    if(err){
        console.log("houve um erro ao rodar a aplicação: "+err)
    }else{
        console.log("servidor rodando na porta: "+8081)
    }
})