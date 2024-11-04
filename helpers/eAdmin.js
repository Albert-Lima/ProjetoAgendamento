module.exports = {
    eAdmin: function(req, res, next){
        if(req.isAuthenticated()){
            return next()
        }
        req.flash("error_msg", "você precisa se cadastrar")
        res.redirect("/auth")
    }
}