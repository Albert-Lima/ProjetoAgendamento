const mongoose = require("mongoose")
const Schema = mongoose.Schema

const horariosDisp = new Schema({
    estabelecimentoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Estabelecimento', required: true },
    dia: { type: String, required: true }, // Data no formato YYYY-MM-DD
    horarios: [{ type: String }], // Lista de horários disponíveis no formato HH:mm
    criadoEm: { type: Date, default: Date.now } // Registro da última atualização
});

const horariosDispModel = mongoose.model('HorariosDisp', horariosDisp);

module.exports = horariosDispModel;