const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")
const EstabelecimentoModel = require("../models/estabelecimentos")
const ProfissionalModel = require("../models/profissional")
const AgendamentoModel = require("../models/agendamento")
const ServicesModel = require("../models/service")

router.get("/agendamentos", eAdmin, (req, res) => {
    const servicesPromise = ServicesModel.find({ userId: req.user.id });
    const profissionaisPromise = ProfissionalModel.find({ userId: req.user.id });
    const agendamentosPromise = AgendamentoModel.find({userId: req.user.id}).populate('service profissional')

    Promise.all([servicesPromise, profissionaisPromise, agendamentosPromise])
        .then(([services, profissionais, agendamentos]) => {
            res.render("admin/agendamento/agendamentos", {
                services: services,
                profissionais: profissionais,
                agendamentos: agendamentos
            });
        })
        .catch((err) => {
            console.log("Erro ao buscar serviços ou profissionais: " + err);
            res.redirect("/estabelecimentos");
        });
});

router.post("/addagendamento", eAdmin, async (req, res)=>{
    const { 
        nameClient, 
        phoneClient, 
        service, 
        profissional,
    } = req.body;

    const erros = [];

    if (!nameClient) erros.push({ texto: "Nome do cliente é obrigatório." });
    if (!phoneClient) erros.push({ texto: "Telefone do cliente é obrigatório." });
    if (!service) erros.push({ texto: "Selecione um serviço" });
    if (!profissional || profissional.length === 0) erros.push({ texto: "Profissionais são obrigatórios." });

    if (erros.length > 0) {
        console.log(erros);
        return res.render("admin/agendamento/agendamentos", { erros });
    }

    try {
        const novoAgendamento = new AgendamentoModel({
            nameClient, 
            phoneClient, 
            service, 
            profissional,
            userId: req.user.id
        });

        await novoAgendamento.save();
        res.redirect("/agendamentos");
    } catch (err) {
        console.error("Erro ao salvar agendamento:", err);
        res.status(500).send("Erro ao salvar agendamento.");
    }
})


module.exports = router