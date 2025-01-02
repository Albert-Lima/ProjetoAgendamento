const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const passport = require("passport");

const Users = require("../models/user");
require("../config/passport")(passport);

const crypto = require("crypto");
const transporter = require("../config/nodemailer");

router.get("/auth", (req, res) => {
    res.render("admin/auth/auth.handlebars");
});

router.get("/auth/verify", async (req, res) => {
    const { token } = req.query;

    if (!token) {
        req.flash("error_msg", "Token inválido.");
        return res.redirect("/auth");
    }

    try {
        const user = await Users.findOne({ verificationToken: token });

        if (!user) {
            req.flash("error_msg", "Token de verificação inválido ou expirado.");
            return res.redirect("/auth");
        }

        user.isVerified = true;
        user.verificationToken = undefined; // Remova o token após a verificação
        await user.save();

        req.flash("success_msg", "E-mail verificado com sucesso! Faça login.");
        res.redirect("/auth");
    } catch (error) {
        req.flash("error_msg", "Erro ao verificar o e-mail.");
        console.log("Erro ao verificar o e-mail:", error);
        res.redirect("/auth");
    }
});

router.post("/auth", async (req, res) => {
    const erros = [];

    // Verificações dos campos nome e senha
    if (!req.body.name || typeof req.body.name === "undefined" || req.body.name === null) {
        erros.push({ texto: "Nome inválido" });
    }
    if (!req.body.password || req.body.password.length < 8) {
        erros.push({ texto: "Senha muito pequena" });
    }

    try {
        const existingUser = await Users.findOne({ email: req.body.email }).lean();
        if (existingUser) {
            erros.push({ texto: "Email já cadastrado" });
        }

        if (erros.length > 0) {
            return res.render("admin/auth/auth.handlebars", { erros });
        }

        const verificationToken = crypto.randomBytes(32).toString("hex");

        const novoUsuario = new Users({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            verificationToken,
        });

        const salt = await bcrypt.genSalt(10);
        novoUsuario.password = await bcrypt.hash(novoUsuario.password, salt);

        await novoUsuario.save();

        const verificationLink = `http://localhost:8081/auth/verify?token=${verificationToken}`;
        await transporter.sendMail({
            from: '"Meu App" albertsousalima@gmail.com',
            to: req.body.email,
            subject: "Verifique seu e-mail",
            html: `
                <h1>Bem-vindo!</h1>
                <p>Por favor, clique no link abaixo para verificar seu e-mail:</p>
                <a href="${verificationLink}">Verificar E-mail</a>
            `,
        });

        req.flash("success_msg", "Cadastro realizado! Verifique seu e-mail para ativar sua conta.");
        res.redirect("/auth");
    } catch (error) {
        req.flash("error_msg", "Houve um erro ao se cadastrar");
        console.log("Erro ao salvar o usuário:", error);
        res.redirect("/auth");
    }
});

router.post("/login", (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.redirect("/auth");

        if (!user.isVerified) {
            req.flash("error_msg", "Por favor, verifique seu e-mail antes de fazer login.");
            return res.redirect("/auth");
        }

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect("/estabelecimentos");
        });
    })(req, res, next);
});

module.exports = router;