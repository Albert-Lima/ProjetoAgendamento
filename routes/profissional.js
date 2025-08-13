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

router.post("/profissionais", eAdmin, upload.single('photo'), async (req, res) => {
    const { name, phone, services } = req.body;
    const erros = [];

    // Validações
    if (!name) erros.push({ texto: "Nome do profissional é obrigatório." });
    if (!phone) erros.push({ texto: "Telefone do profissional é obrigatório." });
    if (!services) erros.push({ texto: "Adicione os serviços." });
    if (!req.file) erros.push({ texto: "Selecione uma foto para o profissional." });

    try {
        // Verificar se o número de telefone já está sendo usado
        const profissionalExistente = await ProfissionalModel.findOne({
            phone,
            userId: req.user.id
        });

        if (profissionalExistente) {
            erros.push({ texto: "Esse número de telefone já está sendo usado por outro profissional." });
        }

        if (erros.length > 0) {
            console.log("houve um erro na parte de salvamento do profissional");
            const profissional = await ProfissionalModel.find({ userId: req.user.id }).populate('services').lean();
            const allServices = await ServicesModel.find({ userId: req.user.id }).lean();

            return res.render("admin/profissionais/profissionais", {
                erros,
                profissional,
                services: allServices,
                user: req.user,
                // Campos preenchidos, se quiser reaproveitar o que foi digitado
                formData: { name, phone, services }
            });
        }

        // Salvar novo profissional
        const novoProfissional = new ProfissionalModel({
            name,
            phone,
            services,
            userId: req.user.id,
            photoUrl: req.file.path
        });

        await novoProfissional.save();
        res.redirect("/profissionais");

    } catch (err) {
        console.error("Erro ao salvar profissional:", err);
        res.status(500).send("Erro ao salvar profissional.");
    }
});

//rota para alterar disponibilidade do profissional via Fetch
router.post("/profissionais/:id/toggle-disponibilidade", eAdmin, async (req, res) => {
    try {
        const prof = await ProfissionalModel.findOne({ _id: req.params.id, userId: req.user.id });

        if (!prof) return res.status(404).json({ success: false, message: "Profissional não encontrado." });

        prof.disponivel = !prof.disponivel;
        await prof.save();

        return res.json({
            success: true,
            message: "Status atualizado.",
            disponivel: prof.disponivel
        });
    } catch (err) {
        console.error("Erro ao alternar disponibilidade:", err);
        return res.status(500).json({ success: false, message: "Erro interno no servidor." });
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