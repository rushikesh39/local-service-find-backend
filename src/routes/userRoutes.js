const express = require("express");
const { userController } = require("../controllers");
const {authMiddleware}=require('../middleware')
const router = express.Router();

// router.post("/register", userController.registerUser);

module.exports = router;
