const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

const ServicesModel = require("../models/service")

router.get("/servicos", eAdmin, (req, res) => {
    res.render("admin/services/servicos");
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
        res.redirect("/profissionais");
    } catch (err) {
        console.error("Erro ao salvar estabelecimento:", err);
        res.status(500).send("Erro ao salvar estabelecimento.");
    }


})

module.exports = router