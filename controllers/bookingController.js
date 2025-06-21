// controllers/bookingController.js
const Booking = require("../models/Booking");
const Service = require("../models/Services");
const User = require("../models/User");

bookService = async (req, res) => {
  try {
    const { serviceId, name,mobile, scheduledDate, address, notes } = req.body;

    const userId = req.user.id;
    // Check if service exists
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    // Check if user is verified
    const user = await User.findById(userId);
    if (!user || !user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please verify your email before booking.",
      });
    }
    // Proceed with booking
    const booking = new Booking({
      userId,
      serviceId,
      providerId: service.providerId,
      name,
      mobile,
      scheduledDate,
      address,
      notes,
    });

    await booking.save();
    res.status(201).json({ message: "Service booked successfully", booking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error while booking service" });
  }
};

getBookingsForProvider = async (req, res) => {
  try {
    const providerId = req.user.id;
    const bookings = await Booking.find({ providerId })
      .populate("userId", "name email")
      .populate("serviceId", "name category")
      .sort({ createdAt: -1 });

    if (bookings.length === 0) {
      return res
        .status(200)
        .json({ message: "No bookings found", bookings: [] });
    }
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Fetch bookings error:", err);
    res.status(500).json({ message: "Server error while fetching bookings" });
  }
};

getBookingsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const bookings = await Booking.find({ userId })
      .populate("serviceId", "name category providerId")
      .populate("providerId", "name email")
      .sort({ createdAt: -1 });

    if (!bookings.length) {
      return res
        .status(200)
        .json({ message: "No bookings found", bookings: [] });
    }

    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching user bookings" });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.status = status;
    await booking.save();

    res.json({ message: "Booking status updated", booking });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { bookService, getBookingsForProvider,getBookingsForUser,updateBookingStatus };
