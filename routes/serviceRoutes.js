const express = require("express");
const router = express.Router();
const { addService, getServices, getServicesById, servicesList, getPopularServices } = require("../controllers/serviceController");
const authenticateProvider = require("../middleware/providerMiddleware");
const upload = require("../middleware/upload");

router.get("/",servicesList);
router.post("/add", authenticateProvider, upload.single("image"), addService);
router.get("/provider/:providerId",authenticateProvider,getServices);
router.get("/provider/service/:serviceId",authenticateProvider,getServicesById);
// router.put("/update/:id", authenticateProvider,upload.single("image"), updateService);
// router.delete("/delete/:id",authenticateProvider, deleteService);
router.get("/popular-services",getPopularServices);
module.exports = router;
