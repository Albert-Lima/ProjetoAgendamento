const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const EstabelecimentoModel = require("../models/estabelecimentos");
const ProfissionalModel = require("../models/profissional")
const ServicesModel = require("../models/service")

const {eAdmin} = require("../helpers/eAdmin")

router.get("/profissionais", eAdmin, async (req, res) => {
    try {
        const profissionalPromise = ProfissionalModel.find({ userId: req.user.id}).populate('services').lean()
        const servicePromise = ServicesModel.find({ userId: req.user.id}).lean()

        const [profissional, services] = await Promise.all([
            profissionalPromise,
            servicePromise
        ]);
        res.render("admin/profissionais/profissionais", { 
                profissional,
                services
        })
    } catch (err) {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os profissionais");
        res.redirect("/auth");
    }
});


router.get("/addprofissionais", eAdmin, (req, res)=>{
    ServicesModel.find({userId: req.user.id}).lean().then((services)=>{
        res.render("admin/profissionais/addprofissionais", {services: services})
    }).catch((err)=>{
        console.log(err)
        res.redirect("/addprofissionais")
    })
})

router.post("/addprofissionais", eAdmin, (req, res)=>{
    const { name, phone, services } = req.body;
    const erros = [];

    if (!name) erros.push({ texto: "Nome do profissional é obrigatório." });
    if (!phone) erros.push({ texto: "Telefone do profissional é obrigatório." });
    if (!services) erros.push({ texto: "Adicione os serviços" });

    if (erros.length > 0) {
        return res.render("admin/estabelecimentos/profissionais", { erros });
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


//rota para deletar profissional
router.get("/deleteprofissional/:id", eAdmin, async (req, res)=>{
    try{
        const profissionalId = req.params.id

        const deletedProfissional = await ProfissionalModel.findByIdAndDelete(profissionalId);

        res.redirect("/profissionais")
    } catch {
        console.log('Erro ao deletar profissional:', error);
        res.redirect("/profissionais");
    }
})


module.exports = router