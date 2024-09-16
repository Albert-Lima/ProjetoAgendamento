const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require("body-parser")
const path = require("path")
const app = express()

//config
    //Static Files
    app.use(express.static(path.join(__dirname,"public" )))
    //Template Engine
    app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}))
    app.set('view engine', 'handlebars')
    //BodyParser
    app.use(bodyParser.urlencoded({extended: false}))
    app.use(bodyParser.json())



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

app.listen(8081, (err)=>{
    if(err){
        console.log("houve um erro ao rodar a aplicação: "+err)
    }else{
        console.log("servidor rodando na porta: "+8081)
    }
})