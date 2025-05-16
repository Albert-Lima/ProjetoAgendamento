const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2

const EstabelecimentoModel = require("../models/estabelecimentos");
const ProfissionalModel = require("../models/profissional")
const ServicesModel = require("../models/service")

const {eAdmin} = require("../helpers/eAdmin")

const { upload } = require('../config/cloudinary');

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
                services,
                user: req.user
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

router.post("/addprofissionais", eAdmin, upload.single('photo'), async (req, res) => {
    const { name, phone, services } = req.body;
    const erros = [];

    if (!name) erros.push({ texto: "Nome do profissional é obrigatório." });
    if (!phone) erros.push({ texto: "Telefone do profissional é obrigatório." });
    if (!services) erros.push({ texto: "Adicione os serviços" });

    if (erros.length > 0) {
        return res.render("admin/profissionais/profissionais", { erros });
    }

    try {
        // Log do arquivo enviado
        console.log('Arquivo enviado:', req.file);
        // Salvar os dados do profissional
        const novoProfissional = new ProfissionalModel({
            name,
            phone,
            services,
            userId: req.user.id,
            photoUrl: req.file?.path // URL da imagem salva no Cloudinary
        });

        await novoProfissional.save();
        res.redirect("/profissionais");
    } catch (err) {
        console.error("Erro ao salvar profissional:", err);
        res.status(500).send("Erro ao salvar profissional.");
    }
});

router.post("/editprofissionais/:id", eAdmin, async (req, res)=>{
    try{
        const {name, phone, services} = req.body
        const profissionalId = req.params.id
        await ProfissionalModel.findByIdAndUpdate(profissionalId, {
            name,
            phone,
            services
        })
        res.redirect("/profissionais")
    } catch {
        console.log("houve um erro ao salvar a edição do profissional")
        res.redirect("/profissionais")
    }
})


//rota para deletar profissional
router.get("/deleteprofissional/:id", eAdmin, async (req, res)=>{
    try {
        const profissionalId = req.params.id;

        // Encontre o profissional para obter o photoUrl
        const profissional = await ProfissionalModel.findById(profissionalId);

        if (!profissional) {
            console.log('Profissional não encontrado.');
            return res.redirect("/profissionais");
        }

        // Extrai o public_id do Cloudinary a partir da URL da imagem
        const photoUrl = profissional.photoUrl;
        if (photoUrl) {
            const publicId = photoUrl.split('/').pop().split('.')[0]; // Extrai o ID único da imagem
            await cloudinary.uploader.destroy(`profissionais/${publicId}`);
        }

        // Deleta o profissional do banco de dados
        await ProfissionalModel.findByIdAndDelete(profissionalId);

        res.redirect("/profissionais");
    } catch (error) {
        console.error('Erro ao deletar profissional:', error);
        res.redirect("/profissionais");
    }
})


module.exports = router