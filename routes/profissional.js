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
    if (!name) erros.push({ texto: "Por favor, informe o nome do profissional." });
    if (!phone) erros.push({ texto: "O número de telefone do profissional é obrigatório." });
    if (!services) erros.push({ texto: "É necessário adicionar ao menos um serviço para o profissional." });
    if (!req.file) erros.push({ texto: "Selecione uma foto para identificar o profissional." });

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
            erros.forEach(err => req.flash("error_msg", err.texto));
            return res.redirect("/profissionais");
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

router.post("/editprofissionais/:id", eAdmin, upload.single('photo'), async (req, res) => {
    try {
        const { name, phone, services } = req.body;
        const profissionalId = req.params.id;
        const erros = [];

        // Validações básicas
        if (!name) erros.push({ texto: "Por favor, informe o nome do profissional." });
        if (!phone) erros.push({ texto: "O número de telefone do profissional é obrigatório." });
        if (!services) erros.push({ texto: "É necessário adicionar ao menos um serviço para o profissional." });
        // Aqui a foto não é obrigatória, pois pode ser mantida a anterior

        // Verificar se o número de telefone já está sendo usado por outro profissional
        const profissionalExistente = await ProfissionalModel.findOne({
            phone,
            userId: req.user.id,
            _id: { $ne: profissionalId } // Ignora o próprio profissional
        });

        if (profissionalExistente) {
            erros.push({ texto: "Esse número de telefone já está sendo usado por outro profissional." });
        }

        if (erros.length > 0) {
            console.log("dado inválido ao editar profissional");

            erros.forEach(err => req.flash("error_msg", err.texto));
            return res.redirect("/profissionais");
            
        }

        // Caso passe nas validações, segue para a atualização
        const updateData = { name, phone, services };
        if (req.file) {
            updateData.photoUrl = req.file.path;
            console.log("a foto foi selecionada e será alterada");
        }

        await ProfissionalModel.findByIdAndUpdate(profissionalId, updateData);
        console.log("profissional atualizado");
        res.redirect("/profissionais");

    } catch (err) {
        console.log("houve um erro ao salvar a edição do profissional:", err);
        res.redirect("/profissionais");
    }
});


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