const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: "albertsousalima@gmail.com",
        pass: "nbfj tyce agur hguz"
    },
    tls: {
        rejectUnauthorized: true, // Rejeita envios com problemas de autenticação ou conexão
    },
});

module.exports = transporter;