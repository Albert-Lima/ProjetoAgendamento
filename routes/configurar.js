const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

router.get("/configurar", eAdmin, (req, res) => {
    res.render("admin/configuracoes");
});

module.exports = router