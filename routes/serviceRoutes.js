const express = require("express");
const router = express.Router();
const { addService, getServices, getServicesById, servicesList, getPopularServices ,updateStatus, getTopRatedServices} = require("../controllers/serviceController");
const authenticateProvider = require("../middleware/providerMiddleware");
const upload = require("../middleware/upload");

router.get("/",servicesList);
router.post("/add", authenticateProvider, upload.single("image"), addService);
router.get("/provider/:providerId",authenticateProvider,getServices);
router.get("/details/:serviceId",getServicesById);
router.put("/update-status", authenticateProvider, updateStatus);
router.get("/popular-services",getPopularServices);
router.get("/top-rated-services",getTopRatedServices);
module.exports = router;
