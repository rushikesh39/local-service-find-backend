const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");

const {
  forgotPassword,
  resetPassword,
} = require("../controllers/outhController");

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account",
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = jwt.sign(
      {
        userId: req.user._id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15d",
      }
    );
    // res.send({ message: "Google login successful", token });
    const redirectUrl = `http://localhost:5173/social-auth-success?token=${token}&name=${encodeURIComponent(
      req.user.name
    )}&email=${encodeURIComponent(req.user.email)}`;

    res.redirect(redirectUrl);
  }
);

router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"], authType: "rerequest" })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user._id, email: req.user.email, name: req.user.name },
      process.env.JWT_SECRET,
      {
        expiresIn: "15d",
      }
    );
    const redirectUrl = `http://localhost:5173/social-auth-success?token=${token}&name=${encodeURIComponent(
      req.user.name
    )}&email=${encodeURIComponent(req.user.email)}`;
    res.redirect(redirectUrl);
  }
);
module.exports = router;
