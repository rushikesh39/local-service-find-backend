// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const {
  bookService,
  getBookingsForProvider,
  updateBookingStatus,
  todaysBooking,
  getProviderDashboardStats,
} = require("../controllers/bookingController");
const auth = require("../middleware/providerMiddleware");
const authenticateProvider = require("../middleware/providerMiddleware");

router.post("/book", auth, bookService);
router.get(
  "/provider/get-booking",
  authenticateProvider,
  getBookingsForProvider
);
router.get("/provider/todays-booking", authenticateProvider, todaysBooking);
router.get(
  "/provider/dashboard-starts",
  authenticateProvider,
  getProviderDashboardStats
);
router.get("/user/get-booking", auth, getBookingsForUser);
router.patch(
  "/provider/update-booking-status/",
  authenticateProvider,
  updateBookingStatus
);
module.exports = router;
