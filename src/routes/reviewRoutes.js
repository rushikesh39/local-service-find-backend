const express = require("express");
const router = express.Router();
const {upload} = require("../middleware");
const { reviewController } = require("../controllers");
const {authMiddleware}=require('../middleware')

router.post('/submit', upload.single("image"),authMiddleware, reviewController.submitReview);
module.exports = router;