const express = require("express")
const router = express.Router()

router.get("/user", (req, res)=>{
    res.send("Área do profissional")
})

module.exports = router