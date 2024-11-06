const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

router.get("/historico", eAdmin, (req, res) => {
    res.render("admin/historico");
});

module.exports = router