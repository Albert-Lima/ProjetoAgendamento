const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const EstabelecimentoModel = require("../models/estabelecimentos");
const ProfissionalModel = require("../models/profissional")
const ServiceModel = require("../models/services")

const {eAdmin} = require("../helpers/eAdmin")

router.get("/profissionais", eAdmin, (req, res) => {
    EstabelecimentoModel.find({ userId: req.user.id }).lean().then((profissinais) => {
        res.render("admin/profissionais/profissionais", { profissionais });
    }).catch((err) => {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os profissionais");
        res.redirect("/auth");
    });
});
router.get("/addprofissionais", eAdmin, (req, res)=>{
    ServiceModel.find({userId: req.user.id}).lean().then((services)=>{
        console.log(services)
        res.render("admin/profissionais/addprofissionais", {services: services})
    }).catch((err)=>{
        console.log(err)
        res.redirect("/profissionais")
    })
})
router.post("/addprofissionais", eAdmin, (req, res)=>{
    const { name, phone, services } = req.body;
    const erros = [];

    if (!name) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phone) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!services) erros.push({ texto: "Adicione os serviços" });

    if (erros.length > 0) {
        console.log(erros)
        return res.render("admin/profissionais/addprofissionais", { erros: erros });
    }
    try {
        const novoProfissional = new ProfissionalModel({
            name,
            phone,
            services,
            userId: req.user.id
        });
        novoProfissional.save();
        res.redirect("/profissionais");
    } catch (err) {
        console.error("Erro ao salvar estabelecimento:", err);
        res.status(500).send("Erro ao salvar estabelecimento.");
    }
})

module.exports = router