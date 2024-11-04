const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const EstabelecimentoModel = require("../models/estabelecimentos"); // Model de estabelecimentos

const {eAdmin} = require("../helpers/eAdmin")


// PAINEL PRINCIPAL
router.get("/estabelecimentos", eAdmin, (req, res) => {
    EstabelecimentoModel.find({ userId: req.user.id }).lean().then((estab) => {
        res.render("admin/estabelecimentos/estabelecimentos", { estab });
    }).catch((err) => {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os estabelecimentos");
        res.redirect("/auth");
    });
});

router.get("/addestabelecimento", eAdmin, (req, res) => {
    res.render("admin/estabelecimentos/addestabelecimento");
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
        const estabelecimento = await EstabelecimentoModel.findById(req.params.id).lean();
        if (!estabelecimento) {
            req.flash("error_msg", "Estabelecimento não encontrado");
            return res.redirect("/estabelecimentos");
        }
        res.render("admin/estabelecimentos/editestabelecimento", { estabelecimento });
    } catch (err) {
        console.error("Erro ao carregar estabelecimento:", err);
        res.status(500).send("Erro ao carregar estabelecimento.");
    }
});

router.post("/editestabelecimento/:id", eAdmin, async (req, res) => {
    const { nomeEstabelecimento, phoneEstabelecimento, endEstabelecimento, profissionais, horarioInicial, horarioFinal } = req.body;
    const erros = [];

    if (!nomeEstabelecimento) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phoneEstabelecimento) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!endEstabelecimento) erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    if (!profissionais) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horarioInicial) erros.push({ texto: "Horário inicial é obrigatório." });
    if (!horarioFinal) erros.push({ texto: "Horário final é obrigatório." });

    if (erros.length > 0) {
        return res.render("admin/estabelecimentos/editestabelecimento", { erros, estabelecimento: req.body });
    }

    try {
        await EstabelecimentoModel.findByIdAndUpdate(
            req.params.id,
            {
                nomeEstabelecimento,
                phoneEstabelecimento,
                endereco: endEstabelecimento,
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







router.get("/profissionais", eAdmin, (req, res) => {
    EstabelecimentoModel.find({ userId: req.user.id }).lean().then((estab) => {
        res.render("admin/profissionais/profissionais", { estab });
    }).catch((err) => {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os profissionais");
        res.redirect("/auth");
    });
});

router.get("/agendamentos", (req, res) => {
    res.render("admin/agendamentos");
});

router.get("/historico", (req, res) => {
    res.render("admin/historico");
});

router.get("/servicos", (req, res) => {
    res.render("admin/servicos");
});

router.get("/feedbacks", (req, res) => {
    res.render("admin/feedbacks");
});

router.get("/configurar", (req, res) => {
    res.render("admin/configuracoes");
});

module.exports = router;