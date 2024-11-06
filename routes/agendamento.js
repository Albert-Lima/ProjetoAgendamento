const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

router.get("/agendamentos", eAdmin, (req, res) => {
    res.render("admin/agendamentos");
});

module.exports = router