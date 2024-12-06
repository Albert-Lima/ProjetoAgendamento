const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

const ServicesModel = require("../models/service")

router.get("/servicos", eAdmin, (req, res) => {
    ServicesModel.find({ userId: req.user.id }).lean().then((services) => {
        res.render("admin/services/servicos", { services: services });
    }).catch((err) => {
        console.log(err);
        req.flash("error_msg", "Houve um erro ao listar os serviços");
        res.redirect("/auth");
    });
});
router.post("/addservice", eAdmin, (req, res)=>{
    const {name, description, value} = req.body

    const erros = []

    if(!name) erros.push({texto: "qual o nome do serviço?"})
    if(!description) erros.push({texto: "dê uma descrição ao serviço!"})
    if(!value) erros.push({texto: "qual o valor do serviço?"})

    if (erros.length > 0) {
        return res.status(400).json({ erros }); // Retorna os erros em formato JSON
    }
    try {
        const novoServico = new ServicesModel({
            name,
            description,
            value,
            userId: req.user.id
        });
        novoServico.save();
        res.redirect("/servicos");
    } catch (err) {
        console.error("Erro ao salvar estabelecimento:", err);
        res.status(500).send("Erro ao salvar estabelecimento.");
    }
})

router.get("/deleteservice/:id", eAdmin, async (req, res)=>{
    try{
        const serviceId = req.params.id

        await ServicesModel.findByIdAndDelete(serviceId)
    
        res.redirect("/servicos")
    } catch {
        
        res.redirect("/servicos")
    }
})

module.exports = router