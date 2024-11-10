const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Services = new Schema({
    name:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    value: {
        type: Number,
        default: 0
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users", 
        required: true }
})

module.exports = mongoose.model("Services", Services)