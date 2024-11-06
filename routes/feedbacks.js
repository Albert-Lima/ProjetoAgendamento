const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const {eAdmin} = require("../helpers/eAdmin")

router.get("/feedbacks", eAdmin, (req, res) => {
    res.render("admin/feedbacks");
});

module.exports = router