// routes/bookingRoutes.js
const express = require("express");
const router = express.Router();
const { bookService,getBookingsForProvider, updateBookingStatus } = require("../controllers/bookingController");
const auth = require("../middleware/providerMiddleware");
const authenticateProvider = require("../middleware/providerMiddleware");

router.post("/book", auth, bookService);
router.get("/provider/get-booking", authenticateProvider, getBookingsForProvider);
router.get("/user/get-booking", auth, getBookingsForUser);
router.patch("/provider/update-booking-status/", authenticateProvider,updateBookingStatus );
module.exports = router;
