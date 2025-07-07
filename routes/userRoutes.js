const express = require("express");
const { registerUser,verifyOtp, loginUser, sendOtp, contactUs, } = require("../controllers/userController");
const auth=require('../middleware/providerMiddleware')
const router = express.Router();

router.post("/register", registerUser);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/login", loginUser);
router.post("/contact-us",auth, contactUs);

module.exports = router;
