const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");


const Users = require("../models/user");
require("../config/passport")(passport)

router.get("/auth", (req, res) => {
    res.render("admin/auth/auth.handlebars");
});

router.post("/auth", (req, res) => {
    const erros = [];

    // Verificações dos campos nome e senha
    if (!req.body.name || typeof req.body.name === "undefined" || req.body.name === null) {
        erros.push({ texto: "Nome inválido" });
    }
    if (!req.body.password || req.body.password.length < 8) {
        erros.push({ texto: "Senha muito pequena" });
    }

    // Verificação se o email já existe
    Users.findOne({ email: req.body.email }).lean().then((user) => {
        if (user) {
            erros.push({ texto: "Email já cadastrado" });
        }

        // Se houver erros, renderiza a página com os erros
        if (erros.length > 0) {
            return res.render("admin/auth/auth.handlebars", { erros: erros });
        }

        // Se não houver erros, continua com o cadastro
        const novoUsuario = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });

        bcrypt.genSalt(10, (erro, salt) => {
            if (erro) {
                console.log("Erro ao gerar o salt:", erro);
                return res.redirect("/auth");
            }

            bcrypt.hash(novoUsuario.password, salt, (erro, hash) => {
                if (erro) {
                    console.log("Erro ao hash a senha:", erro);
                    return res.redirect("/auth");
                }

                novoUsuario.password = hash;

                // Salva o novo usuário
                novoUsuario.save()
                    .then(() => {
                        res.redirect("/estabelecimentos");
                    })
                    .catch((err) => {
                        req.flash("error_msg", "Houve um erro ao se cadastrar");
                        console.log("Erro ao salvar o usuário:", err);
                        res.redirect("/auth");
                    });
            });
        });
    });
});

router.post("/login", (req, res, next)=>{
    passport.authenticate("local", {
        successRedirect: "/estabelecimentos", 
        failureRedirect: "/auth",
        failureFlash: true
    })(req, res, next)
})

module.exports = router