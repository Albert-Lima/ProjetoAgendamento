const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

const ServicesModel = require("../models/services")

router.get("/servicos", eAdmin, (req, res) => {
    ServicesModel.find({userId: req.user.id}).lean().then((service)=>{
        console.log(service)
        res.render("admin/servicos/servicos", {service: service})
    }).catch((err)=>{
        console.log("houve um erro: "+ err)
        res.redirect("/servicos", {err})
    })
    res.render("admin/servicos/servicos");
});
router.post("/addservice", eAdmin,(req, res)=>{
    const { name, description, value } = req.body;
    const novoService = new ServicesModel({
        name,
        description,
        value,
        userId: req.user.id
    });
    novoService.save().then(()=>{
        console.log("serviço adicionado")
        res.redirect("/servicos")
    }).catch((err)=>{
        console.log(err)
        res.redirect("/servicos")
    })
})

module.exports = router