const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail", 
    auth: {
        user: "albertsousalima@gmail.com",
        pass: "nbfj tyce agur hguz"
    }
});

module.exports = transporter;