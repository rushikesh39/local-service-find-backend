const Booking = require("../models/Booking");
const Service = require("../models/Services");
const User = require("../models/User");
const transporter = require("../config/nodemail");

const sendBookingMail = async (
  email,
  name,
  serviceName,
  status,
  scheduledDate,
  address
) => {
  try {
    let statusColor, statusText;

    switch (status) {
      case "pending":
        statusColor = "#f39c12";
        statusText = "⏳ Pending Confirmation";
        break;
      case "confirmed":
        statusColor = "#28a745";
        statusText = "✅ Booking Confirmed";
        break;
      case "cancelled":
        statusColor = "#e74c3c";
        statusText = "❌ Booking Cancelled";
        break;
      case "completed":
        statusColor = "#3498db";
        statusText = "🎉 Service Completed";
        break;
      default:
        statusColor = "#333";
        statusText = status;
    }

    await transporter.sendMail({
      to: email,
      from: `"Locafy Bookings" <${process.env.EMAIL_USER}>`,
      subject: `📢 Your Booking Status: ${statusText}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; background: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0px 4px 12px rgba(0,0,0,0.05);">
          <div style="text-align: center;">
            <h2 style="color: ${statusColor};">${statusText}</h2>
            <p style="font-size: 16px; color: #555;">Hello <strong>${name}</strong>,</p>
            <p style="font-size: 16px; color: #555;">
              Your booking for <strong>${serviceName}</strong> has been updated to the status: 
              <span style="color: ${statusColor}; font-weight: bold;">${status.toUpperCase()}</span>.
            </p>
            <div style="margin: 20px auto; padding: 12px 24px; background-color: #f9f9f9; border-radius: 6px; text-align: left;">
              <p style="margin: 6px 0;"><strong>📅 Scheduled Date:</strong> ${new Date(
                scheduledDate
              ).toLocaleString()}</p>
              <p style="margin: 6px 0;"><strong>📍 Address:</strong> ${address}</p>
            </div>
            ${
              status === "confirmed"
                ? `<p style="font-size: 16px; color: #28a745;">Please be ready on the scheduled date. Our provider will reach you as per your booking time.</p>`
                : ""
            }
            ${
              status === "cancelled"
                ? `<p style="font-size: 16px; color: #e74c3c;">Your booking has been cancelled. If this was a mistake, please rebook the service.</p>`
                : ""
            }
            ${
              status === "completed"
                ? `<p style="font-size: 16px; color: #3498db;">Thank you for using Locafy. We hope you had a great experience! </p>`
                : ""
            }
            <p style="margin-top: 20px; font-size: 14px; color: #888;">If you have any questions, reply to this email or contact our support team.</p>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #aaa; text-align: center;">
            &copy; ${new Date().getFullYear()} Locafy. All rights reserved.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Booking email send error:", error);
  }
};

const bookService = async (req, res) => {
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

    // Create booking
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

    // ✅ Send Pending Booking Email
   
    await sendBookingMail(
      user.email,
      user.name,
      service.name,
      "pending",
      scheduledDate,
      address
    );

    res.status(201).json({ message: "Service booked successfully", booking });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error while booking service" });
  }
};

const getBookingsForProvider = async (req, res) => {
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

const getBookingsForUser = async (req, res) => {
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

    const allowedStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (
      booking.providerId.toString() !== req.user.id &&
      !(newStatus === "cancelled" && booking.userId.toString() === req.user.id) &&
      !(newStatus === "completed" && booking.userId.toString() === req.user.id && booking.status === "confirmed")
    ) {
      return res.status(403).json({ message: "Unauthorized action" });
    }

    const currentStatus = booking.status;
    if (currentStatus === "completed") {
      return res
        .status(400)
        .json({ message: "Completed bookings cannot be changed" });
    }
    if (currentStatus === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cancelled bookings cannot be updated" });
    }

    booking.status = newStatus;
    await booking.save();

    // ✅ Send Status Update Email
    const bookingDetails = await Booking.findById(id)
      .populate("userId", "name email")
      .populate("serviceId", "name");
  
    await sendBookingMail(
      bookingDetails.userId.email,
      bookingDetails.userId.name,
      bookingDetails.serviceId.name,
      newStatus,
      bookingDetails.scheduledDate,
      bookingDetails.address
    );

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
    const bookings = await Booking.find({ providerId }).populate("serviceId");

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaysBookings = bookings.filter(
      (b) => b.createdAt >= startOfDay && b.createdAt <= endOfDay
    );

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
