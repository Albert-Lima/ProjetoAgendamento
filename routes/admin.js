const express = require("express")
const router = express.Router()

router.get("/estabelecimentos", (req, res)=>{
    res.render("admin/estabelecimentos")
})
router.get("/profissionais", (req, res)=>{
    res.render("admin/profissionais")
})
router.get("/agendamentos", (req, res)=>{
    res.render("admin/agendamentos")
})
router.get("/historico", (req, res)=>{
    res.render("admin/historico")
})
router.get("/servicos", (req, res)=>{
    res.render("admin/servicos")
})
router.get("/feedbacks", (req, res)=>{
    res.render("admin/feedbacks")
})
router.get("/configurar", (req, res)=>{
    res.render("admin/configuracoes")
})

module.exports = router