const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

const ClientesModel = require("../models/clientes")

router.get("/clientes", eAdmin, (req, res) => {
    ClientesModel.find({userId: req.user.id}).lean().then((clientes)=>{
        res.render("admin/clientes/clientes", {clientes: clientes});
    })
});



//rota para enviar comfirmação de adicionar usuários
router.post("/clientes/add-cliente", eAdmin, (req, res)=>{
    const {clientName, clientZap} = req.body
    
    const novoCliente = new ClientesModel({
        clientName,
        clientZap,
        clientServices: [],
        userId: req.user.id
    })

    novoCliente.save().then(()=>{
        res.redirect("/clientes")
        console.log("cliente salvo com sucesso")
    }).catch((error)=>{
        res.render("admin/clientes/clientes")
        console.log("houve um erro ao salvar o cliente: "+error)
    })
    
})

//rota para deletar clientes
router.get("/clientes/delete-cliente/:id", eAdmin, async(req, res)=> {
    try{
        const clienteId = req.params.id
    
        await ClientesModel.findByIdAndDelete(clienteId)
        
        res.redirect("/clientes")
    } catch {
            
        res.redirect("/clientes")
    }
})

module.exports = router