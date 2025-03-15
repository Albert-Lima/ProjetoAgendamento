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
        req.flash("error_msg", "Verifique seu email");
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
            from: '"Glamis App" albertsousalima@gmail.com',
            to: req.body.email,
            subject: "Verifique seu e-mail",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #1F5055; border-radius: 10px; background-color: #f9f9f9;">
                    <h1 style="color: #333; text-align: center;">Bem-vindo ao Glamis!</h1>
                    <p style="font-size: 16px; color: #555; text-align: center;">
                        Para ativar sua conta, clique no botão abaixo:
                    </p>
                    <div style="text-align: center; margin: 20px 0;">
                        <a href="${verificationLink}" 
                        style="display: inline-block; background-color: #1F5055; color: #fff; text-decoration: none; 
                                padding: 12px 20px; border-radius: 5px; font-size: 18px; font-weight: bold;">
                            Verificar E-mail
                        </a>
                    </div>
                    <p style="font-size: 14px; color: #777; text-align: center;">
                        Se você não se cadastrou no Gendal, ignore este e-mail.
                    </p>
                </div>
            `,
        });

        req.flash("success_msg", "Cadastro realizado! Verifique seu e-mail para ativar sua conta.");
        res.redirect("/auth/verify");
    } catch (error) {
        req.flash("error_msg", "Houve um erro ao se cadastrar");
        console.log("Erro ao salvar o usuário:", error);
        res.redirect("/auth");
    }
});

router.post("/login", (req, res, next) => {
    passport.authenticate("local", async (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            req.flash("error_msg", "Usuário não encontrado ou senha inválida.");
            return res.redirect("/auth");
        }

        if (!user.isVerified) {
            req.flash("error_msg", "Por favor, verifique seu e-mail antes de fazer login.");
            return res.redirect("/auth"); // Adicionado o `return` aqui
        }

        req.logIn(user, (err) => {
            if (err) return next(err);
            return res.redirect("/estabelecimentos");
        });
    })(req, res, next);
});

router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log("Erro ao fazer logout:", err);
            req.flash("error_msg", "Erro ao fazer logout.");
            return res.redirect("/estabelecimentos");
        }
        req.flash("success_msg", "Você saiu da sua conta.");
        res.redirect("/auth");
    });
});




module.exports = router;