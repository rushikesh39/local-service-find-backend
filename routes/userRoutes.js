const express = require("express");
const { userController } = require("../controllers");
const {authMiddleware}=require('../middleware')
const router = express.Router();

router.post("/register", userController.registerUser);
router.post("/verify-otp", userController.verifyOtp);
router.post("/send-otp", userController.resendOtp);
router.post("/login", userController.loginUser);
router.post("/contact-us",authMiddleware, userController.contactUs);

module.exports = router;
