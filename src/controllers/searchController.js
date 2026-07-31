const { Service } = require("../models");
const { ApiError, ApiResponse, asyncHandler } = require("../utils");
const { HTTP } = require("../constant");

const search = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 10000, query, page = 1, limit = 10 } = req.query;

  // Search query is required
  if (!query?.trim()) {
    throw new ApiError(HTTP.BAD_REQUEST, "Search query is required.");
  }

  const skip = (Number(page) - 1) * Number(limit);

  // ==========================
  // Nearby Search
  // ==========================
  if (lat && lng) {
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      throw new ApiError(HTTP.BAD_REQUEST, "Invalid latitude or longitude.");
    }

    const services = await Service.find(
      {
        status: "active",
        $text: { $search: query },
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: Number(radius),
          },
        },
      },
      {
        score: { $meta: "textScore" },
      },
    )
      .sort({ score: { $meta: "textScore" } })
      .skip(skip)
      .limit(Number(limit));

    return res.status(HTTP.OK).json(
      new ApiResponse(HTTP.OK, "Search results fetched successfully.", {
        total: services.length,
        page: Number(page),
        limit: Number(limit),
        services,
      }),
    );
  }

  // ==========================
  // Normal Search
  // ==========================

  const services = await Service.find({
    status: "active",
    $text: {
      $search: query,
    },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  return res.status(HTTP.OK).json(
    new ApiResponse(HTTP.OK, "Search results fetched successfully.", {
      total: services.length,
      page: Number(page),
      limit: Number(limit),
      services,
    }),
  );
});

module.exports = {
  search,
};
