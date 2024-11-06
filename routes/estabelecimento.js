const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const EstabelecimentoModel = require("../models/estabelecimentos");
const ProfissionaisModel = require("../models/profissional")

const {eAdmin} = require("../helpers/eAdmin")

router.get("/estabelecimentos", eAdmin, (req, res) => {
    EstabelecimentoModel.find({ userId: req.user.id }).lean().then((estab) => {
        res.render("admin/estabelecimentos/estabelecimentos", { estab, user: req.user});
    }).catch((err) => {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os estabelecimentos");
        res.redirect("/auth");
    });
});

router.get("/addestabelecimento", eAdmin, (req, res) => {
    try {
        const [estab, prof] = Promise.all([
            EstabelecimentoModel.find({ userId: req.user.id }).lean(),
            ProfissionaisModel.find({ userId: req.user.id }).lean()
        ]);
        console.log(estab)

        res.render("admin/estabelecimentos/estabelecimentos", { 
            estab: estab,
            profissionais: prof,
            user: req.user
        });
    } catch (err) {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os estabelecimentos e profissionais");
        res.redirect("/auth");
    }
});

router.post("/addestabelecimento", eAdmin, async (req, res) => {
    const { nomeEstabelecimento, phoneEstabelecimento, endEstabelecimento, profissionais, horarioInicial, horarioFinal } = req.body;
    const erros = [];

    if (!nomeEstabelecimento) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phoneEstabelecimento) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!endEstabelecimento) erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    if (!profissionais) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horarioInicial) erros.push({ texto: "Horário inicial é obrigatório." });
    if (!horarioFinal) erros.push({ texto: "Horário final é obrigatório." });

    if (erros.length > 0) {
        return res.render("admin/estabelecimentos/addestabelecimento", { erros });
    }
    try {
        const novoEstabelecimento = new EstabelecimentoModel({
            nomeEstabelecimento,
            phoneEstabelecimento,
            endereco: endEstabelecimento,
            profissionais,
            horarioInicial,
            horarioFinal,
            userId: req.user.id
        });
        await novoEstabelecimento.save();
        res.redirect("/estabelecimentos");
    } catch (err) {
        console.error("Erro ao salvar estabelecimento:", err);
        res.status(500).send("Erro ao salvar estabelecimento.");
    }
});

router.get("/editestabelecimento/:id", eAdmin, async (req, res) => {
    
    try {
        const [estabelecimento, profissionais] = await Promise.all([
            EstabelecimentoModel.findOne({ _id: req.params.id }).lean(),
            ProfissionaisModel.find({ userId: req.user.id }).lean()
        ]);
        console.log(estabelecimento)

        res.render("admin/estabelecimentos/editestabelecimento", { 
            estabelecimento: estabelecimento,
            profissionais: profissionais,
            user: req.user
        });
    } catch (err) {
        console.error("Erro ao carregar estabelecimento:", err);
        res.status(500).send("Erro ao carregar estabelecimento.");
    }
});

router.post("/editestabelecimento/:id", eAdmin, async (req, res) => {
    const { nomeEstabelecimento, phoneEstabelecimento, endEstabelecimento, profissionais, horarioInicial, horarioFinal, endereco } = req.body;
    const erros = [];

    if (!nomeEstabelecimento) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phoneEstabelecimento) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!endEstabelecimento) erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    if (!profissionais) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horarioInicial) erros.push({ texto: "Horário inicial é obrigatório." });
    if (!horarioFinal) erros.push({ texto: "Horário final é obrigatório." });

    if (erros.length > 0) {
        console.log("houve erros ao salvar edição: "+ erros)
        return res.render("admin/estabelecimentos/editestabelecimento", { erros, estabelecimento: req.body });
    }

    try {
        await EstabelecimentoModel.findByIdAndUpdate(
            req.params.id,
            {
                nomeEstabelecimento,
                phoneEstabelecimento,
                endereco,
                profissionais,
                horarioInicial,
                horarioFinal
            },
            { new: true } // Retorna o documento atualizado
        );
        res.redirect("/estabelecimentos");
    } catch (err) {
        console.error("Erro ao atualizar estabelecimento:", err);
        res.status(500).send("Erro ao atualizar estabelecimento.");
    }
});

module.exports = router;