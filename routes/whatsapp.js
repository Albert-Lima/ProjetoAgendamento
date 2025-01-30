const express = require("express");
const router = express.Router();
const qrcode = require("qrcode"); // Biblioteca para gerar QR Code como imagem
const mongoose = require("mongoose");
const path = require("path");
const { Client, LocalAuth } = require("whatsapp-web.js");

const { eAdmin } = require("../helpers/eAdmin");

// Armazena instâncias de bots ativas
const clients = {};

// Rota para exibir a página de gerenciamento do WhatsApp
router.get("/whatsapp", eAdmin, (req, res) => {
    res.render("admin/whatsapp/whatsapp");
});

// Rota para iniciar o bot para um usuário
router.post("/whatsapp/start", eAdmin, async (req, res) => {
    const userId = req.user.id; // Obtém o ID do usuário logado

    if (clients[userId]) {
        return res.status(200).json({ message: "Bot já está ativo para este usuário." });
    }

    try {
        const client = new Client({
            authStrategy: new LocalAuth({
                dataPath: path.join(__dirname, "../sessions", userId),
            }),
        });

        // Evento do QR Code
        client.on("qr", async (qr) => {
            console.log(`QR Code gerado para o usuário ${userId}`);
            const qrImage = await qrcode.toDataURL(qr); // Converte o QR Code em uma URL de imagem
            res.status(200).json({ qrImage }); // Envia o QR Code como imagem para o front-end
        });

        client.on("ready", () => {
            console.log(`Bot do usuário ${userId} está pronto!`);
        });

        client.on("disconnected", (reason) => {
            console.log(`Bot do usuário ${userId} foi desconectado: ${reason}`);
            delete clients[userId];
        });

        client.initialize();
        clients[userId] = client;

    } catch (error) {
        console.error(`Erro ao iniciar o bot para o usuário ${userId}:`, error);
        return res.status(500).json({ error: "Erro ao iniciar o bot." });
    }
});

// Rota para encerrar o bot para um usuário
router.post("/whatsapp/stop", eAdmin, (req, res) => {
    const userId = req.user.id; // Obtém o ID do usuário logado

    if (!clients[userId]) {
        return res.status(400).json({ message: "Nenhum bot ativo para este usuário." });
    }

    try {
        clients[userId].destroy();
        delete clients[userId];
        res.status(200).json({ message: "Bot encerrado com sucesso." });
    } catch (error) {
        console.error(`Erro ao encerrar o bot para o usuário ${userId}:`, error);
        res.status(500).json({ error: "Erro ao encerrar o bot." });
    }
});

module.exports = router;