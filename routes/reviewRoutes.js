const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const { submitReview } = require("../controllers/reviewController");
const auth=require('../middleware/providerMiddleware')

router.post('/submit', upload.single("image"),auth, submitReview);
module.exports = router;