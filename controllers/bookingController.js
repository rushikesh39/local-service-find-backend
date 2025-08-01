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
    const { id, newStatus } = req.body;

    // ✅ 1. Validate new status
    const allowedStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // ✅ 2. Fetch booking
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ 3. Authorization check
    // Providers can update their own bookings
    // Users can cancel their own bookings only
    if (
      booking.providerId.toString() !== req.user.id &&
      !(newStatus === "cancelled" && booking.userId.toString() === req.user.id)
    ) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    // ✅ 4. Prevent invalid transitions
    const currentStatus = booking.status;
    if (currentStatus === "completed") {
      return res.status(400).json({ message: "Completed bookings cannot be changed" });
    }
    if (currentStatus === "cancelled") {
      return res.status(400).json({ message: "Cancelled bookings cannot be updated" });
    }

    // ✅ 5. Update and return the updated booking
    booking.status = newStatus;
    await booking.save();

    return res.json({
      message: `Booking status updated to '${newStatus}' successfully`,
      booking,
    });
  } catch (err) {
    console.error("Status update error:", err);
    return res.status(500).json({ message: "Server error. Please try again." });
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

    // All bookings for provider
    const bookings = await Booking.find({ providerId }).populate("serviceId");

    // Today range
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Today's bookings
    const todaysBookings = bookings.filter(
      (b) => b.createdAt >= startOfDay && b.createdAt <= endOfDay
    );

    // ======== SALES CALCULATIONS ==========
    const todaySales = todaysBookings.reduce((sum, b) => {
      if (b.status === "completed") {
        return sum + (parseFloat(b?.serviceId?.price) || 0);
      }
      return sum;
    }, 0);

    const totalSales = bookings.reduce((sum, b) => {
      if (b.status === "completed") {
        return sum + (parseFloat(b?.serviceId?.price) || 0);
      }
      return sum;
    }, 0);

    // ======= STATS =========
    const todayStats = {
      sales: todaySales,
      bookings: todaysBookings.length,
      pending: todaysBookings.filter((b) => b.status === "pending").length,
      completed: todaysBookings.filter((b) => b.status === "completed").length,
    };

    const totalStats = {
      sales: totalSales,
      bookings: bookings.length,
      pending: bookings.filter((b) => b.status === "pending").length,
      completed: bookings.filter((b) => b.status === "completed").length,
    };

    // ======= TOP SERVICES =========
    const topServiceCounts = {};
    for (let b of bookings) {
      const sid = b.serviceId?._id?.toString();
      if (sid) topServiceCounts[sid] = (topServiceCounts[sid] || 0) + 1;
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
      today: todayStats,
      total: totalStats,
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
