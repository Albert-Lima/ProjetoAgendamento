const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: "glamisapp@gmail.com",
        pass: "kjou beqe wvyk kuzk"
    },
    tls: {
        rejectUnauthorized: true, // Rejeita envios com problemas de autenticação ou conexão
    },
});

module.exports = transporter;