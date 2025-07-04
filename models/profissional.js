const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Profissional = new Schema({
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    services: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Services', 
        default: [] }
    ],
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users", 
        required: true 
    },
    photoUrl: { 
        type: String 
    }, // URL da imagem no Cloudinary
    disponivel: {
        type: Boolean,
        default: true // ou false, se quiser começar como "indisponível"
    }
})

module.exports = mongoose.model('Profissional', Profissional)