const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment")

const {eAdmin} = require("../helpers/eAdmin")
const EstabelecimentoModel = require("../models/estabelecimentos")
const ProfissionalModel = require("../models/profissional")
const AgendamentoModel = require("../models/agendamento")
const ServicesModel = require("../models/service")




// Rodar todos os dias à meia-noite
const cron = require("node-cron")
cron.schedule('0 0 * * *', async () => {
    
    try {
        const today = new Date(); // Data atual
        const twoDaysAgo = new Date();
        today.setDate(today.getDate() - 1)
        twoDaysAgo.setDate(today.getDate() - 30); // Data de 30 dias atrás

        // Remover agendamentos com isDeleted: true e data <= dois dias atrás
        const deletedAgendamentos = await AgendamentoModel.deleteMany({
            isDeleted: true,
            data: { $lte: twoDaysAgo }
        });

        // Remover agendamentos com isDeleted: false e data < hoje
        const expiredAgendamentos = await AgendamentoModel.deleteMany({
            isDeleted: false,
            data: { $lt: today }
        });


        //console.log(`Agendamentos removidos (isDeleted: true): ${deletedAgendamentos.deletedCount}`);
        //console.log(`Agendamentos removidos (isDeleted: false): ${expiredAgendamentos.deletedCount}`);
    } catch (err) {
        console.error('Erro ao remover agendamentos:', err);
    }
});

router.post("/agendamentos/verifyDays", eAdmin, async (req,res)=>{
    try {
        const receivedData = req.body;
        let selectedDate = receivedData.diaMes; // Formato esperado: "DD/MM"

        // Garantir que o momento use o formato correto
        const currentYear = new Date().getFullYear(); // Ano atual
        selectedDate = moment(`${selectedDate}/${currentYear}`, "DD/MM/YYYY", true); // Formato explícito

        if (!selectedDate.isValid()) {
            return res.status(400).json({
                status: 'erro',
                message: 'Data inválida. Por favor, envie no formato DD/MM.',
            });
        }

        // Obter o dia da semana em português
        moment.locale('pt-br');
        const dayOfWeek = selectedDate.format('ddd').toLowerCase(); // Dia da semana em minúsculas

        // Buscar o estabelecimento
        const estabelecimento = await EstabelecimentoModel.findOne({ userId: req.user.id });
        if (!estabelecimento) {
            return res.status(404).json({ status: 'erro', message: 'Estabelecimento não encontrado' });
        }

        // Configurações de horários do estabelecimento
        const { horarioInicial, horarioFinal, intervaloTempo } = estabelecimento;

        // Gerar todos os horários possíveis
        const horariosPossiveis = [];
        let horarioAtual = horarioInicial;

        while (horarioAtual < horarioFinal) {
            horariosPossiveis.push(horarioAtual);
            horarioAtual += intervaloTempo;
        }

        // Buscar agendamentos já existentes para o dia selecionado
        const agendamentos = await AgendamentoModel.find({
            userId: req.user.id,
            data: {
                $gte: selectedDate.startOf('day').toDate(),
                $lte: selectedDate.endOf('day').toDate(),
            }
        });

        // Identificar horários ocupados
        const horariosOcupados = agendamentos.map(a => a.horario);

        // Filtrar horários disponíveis
        if(!estabelecimento.diasFuncionamento.includes(dayOfWeek)){
            var horariosDisponiveis = ["o estabelecimento está fechado nesse dia!"]
            // Responder com os horários disponíveis
            res.json({
                status: 'error',
                horariosDisponiveis,
            });
        }else{
            var horariosDisponiveis = horariosPossiveis.filter(horario => !horariosOcupados.includes(Number(horario)));
            // Responder com os horários disponíveis
            res.json({
                status: 'sucesso',
                horariosDisponiveis,
            });
        }
        
    } catch (err) {
        console.error('Erro ao verificar dias/horários:', err);
        res.status(500).json({ status: 'erro', message: 'Erro interno no servidor' });
    }
})

router.get("/agendamentos", eAdmin, async (req, res) => {
    try {
        const servicesPromise = ServicesModel.find({ userId: req.user.id });
        const profissionaisPromise = ProfissionalModel.find({ userId: req.user.id });
        const agendamentosPromise = AgendamentoModel.find({ userId: req.user.id }).populate('service profissional'); 

        const [services, profissionais, agendamentos] = await Promise.all([
            servicesPromise,
            profissionaisPromise,
            agendamentosPromise
        ]);

        res.render("admin/agendamento/agendamentos", {
            services,
            profissionais,
            user: req.user,
            agendamentos
        });
    } catch (err) {
        console.error("Erro ao listar agendamentos:", err);
        res.redirect("/estabelecimentos");
    }
});


//salva os agendamentos diretamente sem precisar da confirmação via whatsapp
router.post("/addagendamentodirect", eAdmin, async (req, res) => {
    const { 
        nameClient, 
        phoneClient, 
        service, 
        profissional,
        horario,
        data // String no formato "dd mm"
    } = req.body;

    const erros = [];

    if (!nameClient) erros.push({ texto: "Nome do cliente é obrigatório." });
    if (!phoneClient) erros.push({ texto: "Telefone do cliente é obrigatório." });
    if (!service) erros.push({ texto: "Selecione um serviço" });
    if (!profissional || profissional.length === 0) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horario) erros.push({ texto: "Selecione um horário" });
    if (!data) erros.push({ texto: "Data não recebida" });

    if (erros.length > 0) {
        console.log(erros);
        return res.render("admin/agendamento/agendamentos", { erros });
    }

    try {
        // Obter o ano atual
        const currentYear = new Date().getFullYear();

        // Transformar a string de data em um objeto Date
        const [day, month] = data.split("/").map(Number); // Divide a string e converte os valores
        const formattedDate = new Date(currentYear, month - 1, day); // Cria o objeto Date (mês começa em 0)

        // Validação extra: Verificar se a data é válida
        if (isNaN(formattedDate.getTime())) {
            erros.push({ texto: "Data inválida." });
            return res.render("admin/agendamento/agendamentos", { erros });
        }

        // Criação do agendamento
        const novoAgendamento = new AgendamentoModel({
            nameClient, 
            phoneClient, 
            service, 
            profissional,
            horario,
            isDeleted: true,
            data: formattedDate, // Salva a data transformada
            userId: req.user.id
        });

        await novoAgendamento.save();
        res.redirect("/agendamentos");
    } catch (err) {
        console.error("Erro ao salvar agendamento:", err);
        res.status(500).send("Erro ao salvar agendamento.");
    }
});
//adiciona o agendamento por intermeio do whatsapp
router.post("/addagendamentobywhatsapp", eAdmin, async (req, res)=>{
    const { 
        nameClient, 
        phoneClient, 
        service, 
        profissional,
        horario,
        data // String no formato "dd mm"
    } = req.body;

    const erros = [];

    if (!nameClient) erros.push({ texto: "Nome do cliente é obrigatório." });
    if (!phoneClient) erros.push({ texto: "Telefone do cliente é obrigatório." });
    if (!service) erros.push({ texto: "Selecione um serviço" });
    if (!profissional || profissional.length === 0) erros.push({ texto: "Profissionais são obrigatórios." });
    if (!horario) erros.push({ texto: "Selecione um horário" });
    if (!data) erros.push({ texto: "Data não recebida" });

    if (erros.length > 0) {
        console.log(erros);
        return res.render("admin/agendamento/agendamentos", { erros });
    }

    try {
        // Obter o ano atual
        const currentYear = new Date().getFullYear();

        // Transformar a string de data em um objeto Date
        const [day, month] = data.split("/").map(Number); // Divide a string e converte os valores
        const formattedDate = new Date(currentYear, month - 1, day); // Cria o objeto Date (mês começa em 0)

        // Validação extra: Verificar se a data é válida
        if (isNaN(formattedDate.getTime())) {
            erros.push({ texto: "Data inválida." });
            return res.render("admin/agendamento/agendamentos", { erros });
        }

        // Criação do agendamento
        const novoAgendamento = new AgendamentoModel({
            nameClient, 
            phoneClient, 
            service, 
            profissional,
            horario,
            isDeleted: false,
            data: formattedDate, // Salva a data transformada
            userId: req.user.id
        });

        await novoAgendamento.save();
        res.redirect("/agendamentos");
    } catch (err) {
        console.error("Erro ao salvar agendamento:", err);
        res.status(500).send("Erro ao salvar agendamento.");
    }
})




router.get("/deleteagendamento/:id", eAdmin, async (req, res)=>{
    try{
        const agendamentoId = req.params.id
        const agendamentoPromise = await AgendamentoModel.findByIdAndDelete(agendamentoId)

        console.log(agendamentoId)

        res.redirect("/agendamentos")
    } catch {
        console.log("houve um erro ao deletar o agendamento")
        res.redirect("/agendamentos")
    }
})


module.exports = router