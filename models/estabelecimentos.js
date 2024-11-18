const mongoose = require('mongoose');

// Definindo o schema
const estabelecimentoSchema = new mongoose.Schema({
    nomeEstabelecimento: {type: String, required: true },
    phoneEstabelecimento: {type: String, required: true },
    endereco: {type: String, required: true },
    profissionais: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profissional', default: [] }],
    diasFuncionamento: [{ type: String, enum: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'] }],
    horarioInicial: {type: Number,default: 8,},
    horarioFinal: {type: Number, default: 21,},
    intervaloTempo: {type: Number,default: 1},
    pictureEstabelecimento: {type: String,default: false},
    dataCriacao: {type: Date, default: Date.now},
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true } // Referência ao usuário
});

const EstabelecimentoModel = mongoose.model('Estabelecimento', estabelecimentoSchema);

module.exports = EstabelecimentoModel;