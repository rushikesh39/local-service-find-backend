// controllers/bookingController.js
const Booking = require("../models/Booking");
const Service = require("../models/Services");
const User = require("../models/User");

bookService = async (req, res) => {
  try {
    const { serviceId, name, mobile, scheduledDate, address, notes } = req.body;

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
    // const { id } = req.params;
    const { id, newStatus } = req.body;
    console.log("data", id, newStatus);

    if (
      !["pending", "confirmed", "completed", "cancelled"].includes(newStatus)
    ) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    booking.status = newStatus;
    await booking.save();

    res.json({ message: "Booking status updated", booking });
  } catch (err) {
    console.error("Status update error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
const todaysBooking = async (req, res) => {
  try {
    const providerId = req.user.id;

    // Today's date range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      providerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("userId", "name email mobile")
      .populate("serviceId", "name category")
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error in todaysBooking:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching today's bookings" });
  }
};
const getProviderDashboardStats = async (req, res) => {
  try {
    const providerId = req.user.id;

    // Fetch all bookings for the provider
    const bookings = await Booking.find({ providerId });
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysBookings = await Booking.find({
      providerId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("userId", "name email mobile")
      .populate("serviceId", "name category price")
      .sort({ createdAt: -1 });

    const todaySales = todaysBookings.reduce((sum, b) => {
      if (b.status == "completed") {
        const price = parseFloat(b?.serviceId.price) || 0;
        return sum + price;
      }
    }, 0);

    const pendingRequests = bookings.filter(
      (b) => b.status === "pending"
    ).length;
    const completedJobs = bookings.filter(
      (b) => b.status === "completed"
    ).length;

    // Top services by count
    const topServiceCounts = {};
    for (let b of bookings) {
      const sid = b.serviceId.toString();
      topServiceCounts[sid] = (topServiceCounts[sid] || 0) + 1;
    }

    const services = await Service.find({
      _id: { $in: Object.keys(topServiceCounts) },
    });

    const topServices = services
      .map((service) => ({
        name: service.name,
        count: topServiceCounts[service._id.toString()] || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    res.status(200).json({
      todaySales,
      todayBookings: todaysBookings.length,
      totalBookings: bookings.length,
      pendingRequests,
      completedJobs,
      topServices,
    });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching dashboard stats" });
  }
};

module.exports = {
  bookService,
  getBookingsForProvider,
  getBookingsForUser,
  updateBookingStatus,
  todaysBooking,
  getProviderDashboardStats,
};
