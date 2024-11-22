const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Agendamentos = new Schema({
    nameClient:{
        type: String,
        required: true
    },
    phoneClient:{
        type: Number,
        required: true
    },
    profissional: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Profissional' ,
        required: true
    },
    service: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Services' ,
        required: true
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users", 
        required: true 
    }
})

module.exports = mongoose.model("Agendamentos", Agendamentos)