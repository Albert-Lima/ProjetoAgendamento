const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

router.get("/auth", (req, res)=>{
    res.render("admin/auth/auth.handlebars")
})

module.exports = router