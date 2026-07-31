const express=require("express")
const {authMiddleware}=require('../middleware')
const {contactController}=require('../controllers')
const router=express.Router()

router.post("/contact-us",authMiddleware, contactController.contactUs);

module.exports=router