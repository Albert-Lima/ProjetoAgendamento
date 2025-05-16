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
        isDeleted: true, // Supondo que agendamentos ativos têm `isDeleted: false`
        data: {
          $gte: startDate,
          $lte: today,
        },
      });
  
      // Geração da lista de dias (DD-MM) para os últimos 30 dias
      const dias = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
  
        // Formata a data no formato DD-MM
        const dia = String(date.getDate()).padStart(2, '0'); // Adiciona zero à esquerda, se necessário
        const mes = String(date.getMonth() + 1).padStart(2, '0'); // Os meses começam do 0, então soma 1
        return `${dia}/${mes}`;
      });
  
      // Inicializar array de contagem de agendamentos
      const agendamentosPorDia = Array(30).fill(0);
  
      // Processar os agendamentos e preencher a contagem
      agendamentos.forEach((agendamento) => {
        const dataAgendamento = new Date(agendamento.data);
        const dia = String(dataAgendamento.getDate()).padStart(2, '0');
        const mes = String(dataAgendamento.getMonth() + 1).padStart(2, '0');
        const diaAgendamento = `${dia}/${mes}`; // Formata para DD-MM
  
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
        const estabelecimentos = await EstabelecimentoModel.find({ userId: req.user.id })
            .populate("profissionais")
            .lean();
    
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
    
        const data30diasAtras = new Date(hoje);
        data30diasAtras.setDate(hoje.getDate() - 29);
    
        const data60diasAtras = new Date(hoje);
        data60diasAtras.setDate(hoje.getDate() - 59);
    
        for (let estab of estabelecimentos) {
            // --- Clientes nos últimos 30 dias (atual) ---
            const clientesUltimos30Dias = await ProfissionaisModel.countDocuments({
                estabelecimentoId: estab._id,
                createdAt: { $gte: data30diasAtras, $lte: hoje }
            });
    
            // --- Clientes entre 31 e 60 dias atrás (período anterior) ---
            const clientesPeriodoAnterior = await ProfissionaisModel.countDocuments({
                estabelecimentoId: estab._id,
                createdAt: { $gte: data60diasAtras, $lt: data30diasAtras }
            });
    
            // --- Porcentagem de crescimento ---
            const crescimentoPercentual = ((clientesUltimos30Dias - clientesPeriodoAnterior) / (clientesPeriodoAnterior || 1)) * 100;
    
            estab.novosClientesUltimos30Dias = clientesUltimos30Dias;
            estab.porcentagemCrescimentoClientes = crescimentoPercentual.toFixed(2); // 2 casas decimais
        }
    
        res.render("admin/estabelecimentos/estabelecimentos", {
            estab: estabelecimentos,
            user: req.user
        });
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
        diasFuncionamento
    } = req.body;

    const erros = [];

    if (!nomeEstabelecimento) erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    if (!phoneEstabelecimento) erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    if (!endereco) erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    if (!horarioInicial) erros.push({ texto: "Horário inicial é obrigatório." });
    if (!horarioFinal) erros.push({ texto: "Horário final é obrigatório." });

    if (!diasFuncionamento || (Array.isArray(diasFuncionamento) && diasFuncionamento.length === 0)) {
        erros.push({ texto: "Pelo menos um dia de funcionamento deve ser selecionado." });
    }

    if (erros.length > 0) {
        try {
            const profissionaisData = await ProfissionaisModel.find({ userId: req.user.id }).lean();
            const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];

            return res.render("admin/estabelecimentos/addestabelecimento", {
                erros,
                nomeEstabelecimento,
                phoneEstabelecimento,
                endereco,
                profissionais,
                horarioInicial,
                horarioFinal,
                diasFuncionamento,
                profissionais: profissionaisData,
                dias: dias
            });
        } catch (err) {
            console.error("Erro ao buscar dados para recarregar o formulário:", err);
            req.flash("error_msg", "Erro interno ao processar o formulário.");
            return res.redirect("/estabelecimentos");
        }
    }

    // Cadastro normal
    try {
        const novoEstabelecimento = new EstabelecimentoModel({
            nomeEstabelecimento,
            phoneEstabelecimento,
            endereco,
            profissionais,
            horarioInicial,
            horarioFinal,
            diasFuncionamento,
            userId: req.user.id
        });

        await novoEstabelecimento.save();
        req.flash("success_msg", "Estabelecimento cadastrado com sucesso!");
        res.redirect("/estabelecimentos");
    } catch (err) {
        console.error("Erro ao salvar estabelecimento:", err);
        req.flash("error_msg", "Erro ao salvar estabelecimento.");
        res.redirect("/estabelecimentos");
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

    if (!nomeEstabelecimento) {
        erros.push({ texto: "Nome do estabelecimento é obrigatório." });
    } 
    if (!phoneEstabelecimento) {
        erros.push({ texto: "Telefone do estabelecimento é obrigatório." });
    }
    if (!endereco) {
        erros.push({ texto: "Endereço do estabelecimento é obrigatório." });
    }
    if (!horarioInicial) {
        erros.push({ texto: "Horário inicial é obrigatório." });
    }
    if (!horarioFinal) {
        erros.push({ texto: "Horário final é obrigatório." });
    }

    if (erros.length > 0) {
        try {
            const profissionaisList = await ProfissionaisModel.find({ userId: req.user.id }).lean();
            return res.render("admin/estabelecimentos/editestabelecimento", { 
                erros: erros, 
                estabelecimento: req.body,
                profissionais: profissionaisList,
                user: req.user
            });
        } catch (err) {
            console.error("Erro ao carregar profissionais:", err);
            return res.status(500).send("Erro ao carregar profissionais.");
        }
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