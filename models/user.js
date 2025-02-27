const mongoose = require("mongoose")
const Schema = mongoose.Schema

const Users = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    verificationToken: {
        type: String,
        required: false,
    }
})

module.exports = mongoose.model('Users', Users)