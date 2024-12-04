const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const EstabelecimentoModel = require("../models/estabelecimentos");
const ProfissionaisModel = require("../models/profissional")
const AgendamentosModel = require("../models/agendamento")
const {eAdmin} = require("../helpers/eAdmin")

//api para renderizar os dados no gráfico
router.get('/agendamentospordias', async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Zerando o horário para comparar apenas datas
      const startDate = new Date();
      startDate.setDate(today.getDate() - 29); // Últimos 30 dias
      startDate.setHours(0, 0, 0, 0); // Zerando o horário também
  
      // Buscar agendamentos dentro do intervalo
      const agendamentos = await AgendamentosModel.find({
        userId: req.user.id,
        isDeleted: true,
        data: {
          $gte: startDate,
          $lte: today,
        },
      });
  
      // Geração da lista de dias (YYYY-MM-DD) para os últimos 30 dias
      const dias = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      });
  
      // Inicializar array de contagem de agendamentos
      const agendamentosPorDia = Array(30).fill(0);
  
      // Processar os agendamentos e preencher a contagem
      agendamentos.forEach((agendamento) => {
        const diaAgendamento = new Date(agendamento.data).toISOString().split('T')[0];
        const index = dias.indexOf(diaAgendamento); // Localizar o índice no array `dias`
        if (index !== -1) {
          agendamentosPorDia[index]++; // Incrementar a contagem no dia correspondente
        }
      });
  
      // Retornar os dados formatados
      res.json({
        labels: dias, // Lista de dias no eixo X
        data: agendamentosPorDia, // Contagem no eixo Y
      });
    } catch (error) {
      console.error('Erro na rota /agendamentospordias:', error);
      res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
    }
  });



router.get("/estabelecimentos", eAdmin, async (req, res) => {
    try {
        const estab = await EstabelecimentoModel.find({ userId: req.user.id }).populate("profissionais").lean();

        res.render("admin/estabelecimentos/estabelecimentos", { estab, user: req.user });
    } catch (err) {
        console.error("Erro ao listar os estabelecimentos:", err);
        req.flash("error_msg", "Houve um erro ao listar os estabelecimentos");
        res.redirect("/auth");
    }
});

router.get("/addestabelecimento", eAdmin, (req, res) => { 
    ProfissionaisModel.find({ userId: req.user.id }).lean()
        .then((profissionais) => {
            
            const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

            res.render("admin/estabelecimentos/addestabelecimento", {
                profissionais: profissionais,
                dias: dias
            });
        })
        .catch((err) => {
            console.log("Houve um erro ao renderizar a página de addestabelecimentos: " + err);
            res.redirect("/estabelecimentos");
        });
});

router.post("/addestabelecimento", eAdmin, async (req, res) => {
    const { 
        nomeEstabelecimento, 
        phoneEstabelecimento, 
        endereco, 
        profissionais, 
        horarioInicial, 
        horarioFinal, 
        diasFuncionamento // Adicionando os dias ao corpo da requisição
    } = req.body;

    const erros = [];

    if (!nomeEstabelecimento) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phoneEstabelecimento) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!endereco) erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    if (!profissionais || profissionais.length === 0) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horarioInicial) erros.push({ texto: "Horário inicial é obrigatório." });
    if (!horarioFinal) erros.push({ texto: "Horário final é obrigatório." });
    if (!diasFuncionamento || diasFuncionamento.length === 0) erros.push({ texto: "Pelo menos um dia de funcionamento deve ser selecionado." });

    if (erros.length > 0) {
        console.log(erros);
        return res.render("admin/estabelecimentos/addestabelecimento", { erros });
    }

    try {
        const novoEstabelecimento = new EstabelecimentoModel({
            nomeEstabelecimento,
            phoneEstabelecimento,
            endereco,
            profissionais,
            horarioInicial,
            horarioFinal,
            diasFuncionamento, // Salvar os dias selecionados
            userId: req.user.id
        });

        await novoEstabelecimento.save();
        res.redirect("/estabelecimentos");
    } catch (err) {
        console.error("Erro ao salvar estabelecimento:", err);
        res.status(500).send("Erro ao salvar estabelecimento.");
    }
});

router.get("/editestabelecimento/:id", eAdmin, async (req, res) => {
    
    try {
        const [estabelecimento, profissionais] = await Promise.all([
            EstabelecimentoModel.findOne({ _id: req.params.id }).lean(),
            ProfissionaisModel.find({ userId: req.user.id }).lean()
        ]);

        res.render("admin/estabelecimentos/editestabelecimento", { 
            estabelecimento: estabelecimento,
            profissionais: profissionais,
            user: req.user
        });
    } catch (err) {
        console.error("Erro ao carregar estabelecimento:", err);
        res.status(500).send("Erro ao carregar estabelecimento.");
    }
});

router.post("/editestabelecimento/:id", eAdmin, async (req, res) => {
    const { nomeEstabelecimento, phoneEstabelecimento, endereco, profissionais, horarioInicial, horarioFinal } = req.body;
    const erros = [];

    if (!nomeEstabelecimento) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phoneEstabelecimento) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!endereco) erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    if (!profissionais) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horarioInicial) erros.push({ texto: "Horário inicial é obrigatório." });
    if (!horarioFinal) erros.push({ texto: "Horário final é obrigatório." });

    if (erros.length > 0) {
        console.log("houve erros ao salvar edição: "+ erros)
        return res.render("admin/estabelecimentos/editestabelecimento", { erros, estabelecimento: req.body });
    }

    try {
        await EstabelecimentoModel.findByIdAndUpdate(
            req.params.id,
            {
                nomeEstabelecimento,
                phoneEstabelecimento,
                endereco,
                profissionais,
                horarioInicial,
                horarioFinal
            },
            { new: true } // Retorna o documento atualizado
        );
        res.redirect("/estabelecimentos");
    } catch (err) {
        console.error("Erro ao atualizar estabelecimento:", err);
        res.status(500).send("Erro ao atualizar estabelecimento.");
    }
});

module.exports = router;