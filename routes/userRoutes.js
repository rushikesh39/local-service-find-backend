const express = require("express");
const { registerUser,verifyOtp, loginUser, contactUs, resendOtp, } = require("../controllers/userController");
const auth=require('../middleware/providerMiddleware')
const router = express.Router();

router.post("/register", registerUser);
router.post("/verify-otp", verifyOtp);
router.post("/send-otp", resendOtp);
router.post("/login", loginUser);
router.post("/contact-us",auth, contactUs);

module.exports = router;
