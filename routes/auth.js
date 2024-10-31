const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Supondo que você tenha definido o modelo Users em algum lugar, importe-o aqui
const Users = require("../models/user");

router.get("/auth", (req, res) => {
    res.render("admin/auth/auth.handlebars");
});

router.post("/auth", (req, res) => {
    const erros = [];

    // Validações
    if (!req.body.name || typeof req.body.name === "undefined" || req.body.name === null) {
        erros.push({ texto: "Nome inválido" });
    }
    if (!req.body.password || req.body.password.length < 8) {
        erros.push({ texto: "Senha muito pequena" });
    }

    // Lidar com erros
    if (erros.length > 0) {
        // Renderiza a página novamente com as mensagens de erro
        console.log(erros)
    } else {
        // Cria um novo usuário
        const novoUsuario = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
        });

        // Gera o hash da senha
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
                        console.log("Erro ao salvar o usuário:", err);
                        res.redirect("/auth");
                    });
            });
        });
    }
});
module.exports = router