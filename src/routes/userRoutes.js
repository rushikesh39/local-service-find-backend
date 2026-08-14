const express = require("express");
const { userController } = require("../controllers");
const {authMiddleware}=require('../middleware')
const router = express.Router();
router.use(authMiddleware)

router.get("/get-user-details", userController.getuserDetails);

module.exports = router;
