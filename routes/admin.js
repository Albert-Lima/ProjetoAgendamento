const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

const EstabelecimentoModel = require("../models/estabelecimentos")//model de estabelecimentos


//ROTAS PARA ESTABELECIMENTOS
    //PAINEL PRINCIPAL
    router.get("/estabelecimentos", (req, res)=>{
        res.render("admin/estabelecimentos/estabelecimentos")
    })
    //ADD ESTABELECIMENTOS
    router.get("/addestabelecimento", (req, res)=>{
        res.render("admin/estabelecimentos/addestabelecimento")
    })
    router.post("/addestabelecimento", (req, res)=>{
        const novoEstabelecimento = new EstabelecimentoModel({
            nomeEstabelecimento: req.body.nomeEstabelecimento,
            phoneEstabelecimento: req.body.phoneEstabelecimento,
            endereco: req.body.endEstabelecimento,
            profissionais: req.body.profissionais, // Recebe array de profissionais
            horarioInicial: req.body.horarioInicial,
            horarioFinal: req.body.horarioFinal
        });
    
        novoEstabelecimento.save()
            .then(() => {
                // Se o salvamento for bem-sucedido, redirecionar ou enviar resposta de sucesso
                res.redirect("/estabelecimentos"); // Redireciona para a lista de estabelecimentos
            })
            .catch((err) => {
                // Se ocorrer algum erro, exibir uma mensagem de erro
                console.error("Erro ao salvar estabelecimento:", err);
                res.status(500).send("Erro ao salvar estabelecimento.");
            });
    })


    router.get("/profissionais", (req, res)=>{
        res.render("admin/profissionais")
    })
    router.get("/agendamentos", (req, res)=>{
        res.render("admin/agendamentos")
    })
    router.get("/historico", (req, res)=>{
        res.render("admin/historico")
    })
    router.get("/servicos", (req, res)=>{
        res.render("admin/servicos")
    })
    router.get("/feedbacks", (req, res)=>{
        res.render("admin/feedbacks")
    })
    router.get("/configurar", (req, res)=>{
        res.render("admin/configuracoes")
    })







module.exports = router