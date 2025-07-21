const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Services = require("../models/Services");
const { cloudinary } = require("../config/cloudinary");

const submitReview = async (req, res) => {
  let uploadedImagePublicId = null; // Track public ID to delete if needed

  try {
    const { rating, reviewText, providerId, bookingId, serviceId } = req.body;
    const userId = req.user.id;

    if (!providerId || !bookingId || !serviceId) {
      return res.status(400).json({ message: "Request not valid!" });
    }

    if (isNaN(rating) || rating < 0 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating value." });
    }

    const existingReview = await Review.findOne({ bookingId, userId });
    if (existingReview) {
      return res
        .status(400)
        .json({ message: "You have already reviewed this booking." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to review this booking." });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ message: "Cannot review a cancelled booking." });
    }

    let imageUrl = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "reviews",
      });
      imageUrl = result.secure_url;
      uploadedImagePublicId = result.public_id;
    }

    const review = await Review.create({
      bookingId,
      providerId,
      userId,
      rating,
      reviewText,
      reviewImages: imageUrl ? [imageUrl] : [],
    });

    booking.status = "completed";
    await booking.save();

    const ratedReviews = await Review.find({ providerId, rating: { $gt: 0 } });
    let avgRating = 0;
    if (ratedReviews.length > 0) {
      const total = ratedReviews.reduce((sum, r) => sum + r.rating, 0);
      avgRating = (total / ratedReviews.length).toFixed(1);
    }

    const service = await Services.findById(serviceId);
    if (!service) {
      throw new Error("Associated service not found.");
    }

    service.rating = avgRating;
    await service.save();

    res.status(200).json({
      message: "Review submitted successfully.",
      review,
      updatedAverageRating: avgRating,
    });
  } catch (err) {
    console.error("Submit Review Error:", err);

    // ❌ Delete uploaded image if something failed after upload
    if (uploadedImagePublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId);
      } catch (deleteErr) {
        console.error("Error deleting image from Cloudinary:", deleteErr);
      }
    }

    res.status(500).json({
      message: "Failed to submit review.",
      error: err.message,
    });
  }
};

module.exports = { submitReview };
