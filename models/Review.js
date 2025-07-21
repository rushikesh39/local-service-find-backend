const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
  rating: { type: Number, min: 0, max: 5, default: null },
  reviewText: { type: String},
  reviewImages:[{type:String}]
}, { timestamps: true });

module.exports = mongoose.model("Review", reviewSchema);
