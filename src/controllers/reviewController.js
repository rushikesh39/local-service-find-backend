const { Services, Booking, Review } = require("../models");
const { cloudinary } = require("../config");
const { validations } = require("../validations");
const { ApiError, ApiResponse, asyncHandler } = require("../utils");
const { HTTP } = require("../constant");

const submitReview = asyncHandler(async (req, res) => {
  const { data, error } = validations.review.safeParse(req.body);
  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Review Data Validation Failed",
      error.flatten().fieldErrors,
    );
  }
  const { rating, reviewText, bookingId } = data;
  const userId = req.user.id;

  const existingReview = await Review.findOne({ bookingId, userId });
  if (existingReview) {
    throw new ApiError(HTTP.BAD_REQUEST, "Already reviewed this booking.");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new ApiError(HTTP.NOT_FOUND, "Booking not found");
  }
  const providerId = booking.providerId;
  const serviceId = booking.serviceId;

  if (booking.userId.toString() !== userId.toString()) {
    throw new ApiError(HTTP.FORBIDDEN, "Unauthorized to review this booking.");
  }

  if (booking.status !== "completed") {
    throw new ApiError(HTTP.BAD_REQUEST, "Service not Completed");
  }
  let uploadedImagePublicId = null;
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
    serviceId,
    userId,
    rating,
    reviewText,
    reviewImages: imageUrl ? [imageUrl] : [],
  });

  const stats = await Review.aggregate([
    {
      $match: {
        serviceId,
        rating: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const avgRating = stats[0]?.avgRating ?? 0;

  await Services.findByIdAndUpdate(serviceId, { rating: avgRating });

  res
    .status(HTTP.CREATED)
    .json(new ApiResponse(HTTP.CREATED, "Review submitted successfully."));
});

module.exports = { submitReview };
