const { User, Service, Booking } = require("../models/User");
const { transporter } = require("../config");
const { ApiResponse, ApiError, asyncHandler } = require("../utils");
const { bookingSchema } = require("../schema");
const { HTTP } = require("../constant");

const sendBookingMail = asyncHandler(
  async (email, name, serviceName, status, scheduledDate, address) => {
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
                scheduledDate,
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
  },
);

const bookService = asyncHandler(async (req, res) => {
  const { data, error } = bookingSchema.bookService.safeParse(req.body);
  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Form Validation Failed",
      error.flatten().fieldErrors,
    );
  }
  const { serviceId, name, mobile, scheduledDate, address, notes } = data;
  const userId = req.user.id;

  // Check if service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new ApiError(HTTP.NOT_FOUND, "Service not found");
  }

  // Check if user is verified
  const user = await User.findById(userId);
  if (!user || !user.isVerified) {
    throw new ApiError(HTTP.BAD_REQUEST, "User not verified");
  }

  const booking = await Booking.create({
    userId,
    serviceId,
    providerId: service.providerId,
    name,
    mobile,
    scheduledDate,
    address,
    notes,
  });

  // ✅ Send Pending Booking Email

  await sendBookingMail(
    user.email,
    user.name,
    service.name,
    "pending",
    scheduledDate,
    address,
  );

  res
    .status(201)
    .json(new ApiResponse(HTTP.CREATED, "Service booked successfully"));
});

const getBookingsForProvider = asyncHandler(async (req, res) => {
  const providerId = req.user.id;
  const bookings = await Booking.find({ providerId })
    .populate("userId", "name email")
    .populate("serviceId", "name category")
    .sort({ createdAt: -1 });

  if (!bookings) {
    return res.status(200).json(new ApiResponse(HTTP.Ok, "No bookings found"));
  }
  res.status(200).json(new ApiResponse(HTTP.OK, "Providers Booking", bookings));
});

const getBookingsForUser = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const bookings = await Booking.find({ userId })
    .populate("serviceId", "name category providerId")
    .populate("providerId", "name email")
    .sort({ createdAt: -1 });

  if (!bookings) {
    return res.status(200).json(new ApiResponse(HTTP.OK, "No bookings found"));
  }
  res.status(200).json(new ApiResponse(HTTP.OK, "User Bookings", bookings));
});
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { data, error } = bookingSchema.updateStatus.safeParse(req.body);

  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Invalid data",
      error.flatten().fieldErrors,
    );
  }

  const { id, newStatus } = data;

  const booking = await Booking.findById(id);

  if (!booking) {
    throw new ApiError(HTTP.NOT_FOUND, "Booking not found");
  }

  // Booking cannot be modified after completion or cancellation
  if (["completed", "cancelled"].includes(booking.status)) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      `Booking is already ${booking.status}`,
    );
  }

  const isProvider = booking.providerId.toString() === req.user.id;
  const isUser = booking.userId.toString() === req.user.id;

  // Allowed transitions
  const providerTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["completed"],
  };

  const userTransitions = {
    pending: ["cancelled"],
    confirmed: ["cancelled"],
  };

  let allowedTransitions = [];

  if (isProvider) {
    allowedTransitions = providerTransitions[booking.status] || [];
  } else if (isUser) {
    allowedTransitions = userTransitions[booking.status] || [];
  } else {
    throw new ApiError(HTTP.FORBIDDEN, "Unauthorized action");
  }

  if (!allowedTransitions.includes(newStatus)) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      `Cannot change booking status from '${booking.status}' to '${newStatus}'`,
    );
  }

  booking.status = newStatus;
  await booking.save();

  const bookingDetails = await Booking.findById(id)
    .populate("userId", "name email")
    .populate("serviceId", "name");

  await sendBookingMail(
    bookingDetails.userId.email,
    bookingDetails.userId.name,
    bookingDetails.serviceId.name,
    newStatus,
    bookingDetails.scheduledDate,
    bookingDetails.address,
  );

  return res
    .status(HTTP.OK)
    .json(
      new ApiResponse(
        HTTP.OK,
        `Booking status updated to '${newStatus}' successfully`,
      ),
    );
});

const todaysBooking = asyncHandler(async (req, res) => {
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

    res.status(200).json(new ApiResponse(HTTP.Ok,"Bookings",bookings));
  })

const getProviderDashboardStats = asyncHandler(async (req, res) => {
  const providerId = new mongoose.Types.ObjectId(req.user.id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  const [stats] = await Booking.aggregate([
    {
      $match: { providerId },
    },
    {
      $lookup: {
        from: "services",
        localField: "serviceId",
        foreignField: "_id",
        as: "service",
      },
    },
    {
      $unwind: {
        path: "$service",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $facet: {
        total: [
          {
            $group: {
              _id: null,
              bookings: { $sum: 1 },
              pending: {
                $sum: {
                  $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
                },
              },
              completed: {
                $sum: {
                  $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                },
              },
              sales: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "completed"] },
                    "$service.price",
                    0,
                  ],
                },
              },
            },
          },
        ],

        today: [
          {
            $match: {
              createdAt: {
                $gte: startOfDay,
                $lte: endOfDay,
              },
            },
          },
          {
            $group: {
              _id: null,
              bookings: { $sum: 1 },
              pending: {
                $sum: {
                  $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
                },
              },
              completed: {
                $sum: {
                  $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                },
              },
              sales: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "completed"] },
                    "$service.price",
                    0,
                  ],
                },
              },
            },
          },
        ],

        topServices: [
          {
            $group: {
              _id: "$serviceId",
              count: { $sum: 1 },
              name: { $first: "$service.name" },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $limit: 5,
          },
          {
            $project: {
              _id: 0,
              name: 1,
              count: 1,
            },
          },
        ],
      },
    },
  ]);

  res.status(200).json(new ApiResponse(HTTP.Ok,"Dashboard Stats", stats));
});

module.exports = {
  bookService,
  getBookingsForProvider,
  getBookingsForUser,
  updateBookingStatus,
  todaysBooking,
  getProviderDashboardStats,
};
