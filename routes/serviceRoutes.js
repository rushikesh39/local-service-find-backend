const express = require("express");
const router = express.Router();
const { addService, getServices,updateService,deleteService, getServicesById, servicesList } = require("../controllers/serviceController");
const authenticateProvider = require("../middleware/providerMiddleware");
const upload = require("../middleware/upload");

router.post("/add", authenticateProvider, upload.single("image"), addService);
router.get("/provider/:providerId",authenticateProvider,getServices);
router.get("/provider/service/:serviceId",authenticateProvider,getServicesById);
router.put("/update/:id", authenticateProvider,upload.single("image"), updateService);
router.delete("/delete/:id",authenticateProvider, deleteService);
router.get("/",servicesList);
module.exports = router;
