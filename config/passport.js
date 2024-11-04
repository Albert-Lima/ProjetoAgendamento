const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

require("../models/user");
const Users = mongoose.model("Users");

module.exports = function(passport) {
    // Estratégia Local
    passport.use(new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        async (email, password, done) => {
            try {
                const user = await Users.findOne({ email: email });
                
                if (!user) {
                    return done(null, false, { message: "Conta não cadastrada!" });
                }

                // Comparação da senha com bcrypt
                const isMatch = await bcrypt.compare(password, user.password);
                
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: "Senha incorreta" });
                }
            } catch (error) {
                return done(error);
            }
        }
    ));

    // Serialização e Desserialização do Usuário
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        console.log("Desserializando usuário com ID:", id);
        try {
            const user = await Users.findById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });
};