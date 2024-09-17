const mongoose = require('mongoose');

// Definindo o schema
const estabelecimentoSchema = new mongoose.Schema({
  
});

// Criando o model
const User = mongoose.model('User', userSchema);

// Exportando o model
module.exports = User;