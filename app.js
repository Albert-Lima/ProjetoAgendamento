const express = require('express')
const handlebars = require('express-handlebars')
const app = express()

//config
    //Template Engine
    app.engine('handlebars', handlebars.engine({defaultLayout: 'main'}))
    app.set('view engine', 'handlebars')


app.get("/estabelecimentos", (req, res)=>{
    res.render('Estabelecimentos/index')
})

app.listen(8081, (err)=>{
    if(err){
        console.log("houve um erro ao rodar a aplicação: "+err)
    }else{
        console.log("servidor rodando na porta: "+8081)
    }
})