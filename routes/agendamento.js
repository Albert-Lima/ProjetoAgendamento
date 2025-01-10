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

//rota para requisição de agendamentos da data passada através do FrontEnd
router.get("/agendamentos/:date", eAdmin, async (req, res) => {
    try {
        const { date } = req.params;

        // Verifica se a data é válida
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ error: "Data inválida" });
        }

        // Obtém o estabelecimento associado ao usuário
        const estabelecimento = await EstabelecimentoModel.findOne({
            userId: req.user.id,
        });
        

        if (!estabelecimento) {
            return res.status(404).json({ error: "Estabelecimento não encontrado" });
        }

        // Obtém os profissionais do estabelecimento
        const profissionais = await ProfissionalModel.find({
            userId: req.user.id,
        });

        // Define o intervalo de horário para os agendamentos
        const horarioInicial = estabelecimento.horarioInicial; // Definido pelo estabelecimento
        const horarioFinal = estabelecimento.horarioFinal; // Definido pelo estabelecimento
        const intervaloMinutos = estabelecimento.intervaloTempo; // Intervalo do estabelecimento

        // Cria a lista de horários
        const horarios = [];
        for (let hora = horarioInicial; hora < horarioFinal; hora++) {
            const horarioFormatado = `${hora}h`;
            horarios.push(horarioFormatado);
        }

        // Converte a data para o início e fim do dia
        const startOfDay = new Date(parsedDate.setUTCHours(0, 0, 0, 0));
        const endOfDay = new Date(parsedDate.setUTCHours(23, 59, 59, 999));

        // Obtém os agendamentos para o dia
        const agendamentos = await AgendamentoModel.find({
            userId: req.user.id,
            data: { $gte: startOfDay, $lte: endOfDay } // Filtra por intervalo
        }).populate("service profissional"); // Popula os dados do serviço e do profissional


        // Organiza os agendamentos por horário e profissional
        const agendamentosOrganizados = {};

        profissionais.forEach((profissional) => {
            agendamentosOrganizados[profissional._id] = {}; // Inicializa o objeto para o profissional
        });

        // Preenche os agendamentosOrganizados com base nos dados de agendamento
        agendamentos.forEach((agendamento) => {
            if (!agendamento.profissional) {
                return; // Caso o profissional seja nulo, pula para o próximo agendamento
            }

            const profId = agendamento.profissional._id.toString();
            const horario = `${agendamento.horario}h`; // Ajuste para incluir a hora com ":00"

            // Verifica se o profissional está no estabelecimento
            if (profissionais.some((prof) => prof._id.toString() === profId)) {
                if (!agendamentosOrganizados[profId][horario]) {
                    agendamentosOrganizados[profId][horario] = [];
                }

                agendamentosOrganizados[profId][horario].push({
                    service: agendamento.service.name, // Nome do serviço
                    clientName: agendamento.nameClient, // Nome do cliente
                    phoneClient: agendamento.phoneClient, // Telefone do cliente (se necessário)
                });
            }
        });
        
        // Responde com os dados organizados para o frontend
        res.json({
            profissionais,
            horarios,
            agendamentosOrganizados,
        });
    } catch (err) {
        console.error("Erro ao buscar agendamentos:", err);
        res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
});

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

        // Horários do estabelecimento (você pode ajustar conforme sua modelagem de dados)
        const estabelecimento = await EstabelecimentoModel.findOne({ userId: req.user.id });
        const { horarioInicial, horarioFinal, intervaloTempo } = estabelecimento;

        // Função para gerar os horários
        const horarios = [];
        let currentTime = horarioInicial; // Horário inicial (ex: 8h)
        horarios.push(`${currentTime}h`)

        for( i = 0; currentTime < horarioFinal - intervaloTempo ; i++){
            currentTime += intervaloTempo; // Incrementa de acordo com o intervalo (em horas)
            const hour = Math.floor(currentTime); // Pega a hora inteira
            horarios.push(`${hour}h`);
        }
        // Renderiza a página passando os dados
        res.render("admin/agendamento/agendamentos", {
            services,
            profissionais,
            user: req.user,
            agendamentos,
            horarios
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