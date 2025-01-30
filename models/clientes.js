const mongoose = require("mongoose")

// Definindo o schema
const clientesSchema = new mongoose.Schema({
    clientName: {
        type: String,
        required: true
    },
    clientZap: {
        type: String,
        required: true
    },
    clientServices: [{
        serviceId: {
            type: mongoose.Schema.Types.ObjectId, // Referência ao modelo de serviços
            ref: 'Services', // Nome do modelo referenciado
            required: false
        },
        quantity: {
            type: Number,
            required: false,
            default: 0,
            min: 0
        }
    }],
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true }
});

const ClientesModel = mongoose.model('Clientes', clientesSchema);

module.exports = ClientesModel;