const express = require("express");
const router = express.Router();
const { servicesController } = require("../controllers");
const { authMiddleware } = require("../middleware");
const upload = require("../middleware/upload");

router.get("/", servicesController.servicesList);
router.post(
  "/add",
  authMiddleware,
  upload.single("image"),
  servicesController.addService,
);
router.get(
  "/provider/:providerId",
  authMiddleware,
  servicesController.getServices,
);
router.get(
  "/details/:serviceId",
  authMiddleware,
  servicesController.getServicesById,
);
router.put("/update-status", authMiddleware, servicesController.updateStatus);
router.get(
  "/popular-services",
  authMiddleware,
  servicesController.getPopularServices,
);
router.get(
  "/top-rated-services",
  authMiddleware,
  servicesController.getTopRatedServices,
);
module.exports = router;
