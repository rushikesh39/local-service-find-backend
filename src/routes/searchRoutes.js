// routes/providerRoutes.js
const express = require("express");
const router = express.Router();
const { searchController } = require("../controllers");

router.get("/", searchController.search); 


module.exports = router;
