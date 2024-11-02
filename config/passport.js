const localStrategy = require("passport-local").Strategy
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

require("../models/user")
const Users = mongoose.model("Users")

module.exports = function(passport){
    passport.use(new localStrategy(
        {usernameField: 'email', passwordField: 'password'},
        (email, password, done)=>{
            Users.findOne({email: email}).then((users)=>{
                if(!users){
                    console.log("conta não cadastrada")
                    return done(null, false, {message: "conta não cadastrada!"})
                }
                bcrypt.compare(password, users.password, (erro, batem)=>{
                    if(batem){
                        console.log("Login bem sucedido")
                        return done(null, users)
                    }else{
                        console.log("senha incorreta")
                        return done(null, false, {message: "senha incorreta"})
                    }
                })
            })
        }
    ))
    passport.serializeUser((users, done)=>{
        done(null, users.id)
    })

    passport.deserializeUser((id, done)=>{
        Users.findById(id).then((users)=>{
            done(null, users)
        }).catch(error => {
            done (error, null)
        })
    })
}