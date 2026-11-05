const express = require("express");
const router = express.Router();
const { servicesController } = require("../controllers");
const { authMiddleware } = require("../middleware");
const { upload, authorize } = require("../middleware");

router.get("/", servicesController.getServices);
router.post(
  "/add",
  authMiddleware,
  authorize("services:create"),
  upload.single("image"),
  servicesController.addService,
);
router.put("/update-status", authMiddleware,authorize("services:update"), servicesController.updateStatus);
router.get(
  "/provider/:providerId",
  authMiddleware,
  servicesController.getServices,
);
router.get(
  "/details/:serviceId",
  servicesController.getServicesById,
);
router.get(
  "/popular-services",
  servicesController.getPopularServices,
);
router.get(
  "/top-rated-services",
  servicesController.getTopRatedServices,
);
module.exports = router;
