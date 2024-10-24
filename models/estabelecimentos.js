const mongoose = require('mongoose');

// Definindo o schema
const estabelecimentoSchema = new mongoose.Schema({
    nomeEstabelecimento: {
        type: String, // Tipo String
        required: true // Campo obrigatório
    },
    phoneEstabelecimento: {
        type: String, // Tipo String
        required: true // Campo obrigatório
    },
    endereco: {
        type: String, // Tipo String
        required: true // Campo obrigatório
    },
    profissionais: {
        type: [String],
        default: [],
    },
    horarioInicial: {
        type: Number,
        default: 8,
    },
    horarioFinal: {
        type: Number,
        default: 21,
    },
    intervaloTempo: {
        type: Number,
        default: 1
    },
    pictureEstabelecimento: {
        type: String,
        default: false
    },
    dataCriacao: {
        type: Date,
        default: Date.now // Define o valor padrão como a data atual
    }
});

const EstabelecimentoModel = mongoose.model('Estabelecimento', estabelecimentoSchema);

module.exports = EstabelecimentoModel;