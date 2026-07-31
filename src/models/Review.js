const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    discription: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Review || mongoose.model("Review", reviewSchema);
