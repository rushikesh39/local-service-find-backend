// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const { bookingController } = require("../controllers");
const { authMiddleware } = require("../middleware");

router.post("/book", authMiddleware, bookingController.bookService);
router.get(
  "/provider/get-booking",
  authMiddleware,
  bookingController.getBookingsForProvider,
);
router.get(
  "/provider/todays-booking",
  authMiddleware,
  bookingController.todaysBooking,
);
router.get(
  "/provider/dashboard-starts",
  authMiddleware,
  bookingController.getProviderDashboardStats,
);
router.get(
  "/user/get-booking",
  authMiddleware,
  bookingController.getBookingsForUser,
);
router.patch(
  "/provider/update-booking-status/",
  authMiddleware,
  bookingController.updateBookingStatus,
);
module.exports = router;
