const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Agendamentos = new Schema({
    nameClient:{
        type: String,
        required: true
    },
    whatsappClient:{
        type: Number,
        required: true
    },
    profissionais: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profissional', default: [] }],
    services: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Services', default: [] }],
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users", 
        required: true 
    }
})

module.exports = mongoose.model("Services", Services)