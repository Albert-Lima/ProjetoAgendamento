const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

router.get("/servicos", eAdmin, (req, res) => {
    res.render("admin/servicos");
});

module.exports = router