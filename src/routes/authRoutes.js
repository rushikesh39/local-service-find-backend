const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const { authController } = require("../controllers");
const { verifyBody } = require("../middleware");

router.post("/register",verifyBody, authController.register);
router.post("/verify-otp",verifyBody, authController.verifyOtp);
router.post("/send-otp",verifyBody, authController.resendOtp);
router.post("/login", verifyBody,authController.login);
router.post("/logout",authController.logout)

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: true,
    failureRedirect: "/login",
  }),
  authController.socialLoginCallback,
);

router.get(
  "/facebook",
  passport.authenticate("facebook", {
    scope: ["email"],
    authType: "rerequest",
  }),
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: true,
    failureRedirect: "/login",
  }),
  authController.socialLoginCallback
);
module.exports = router;
