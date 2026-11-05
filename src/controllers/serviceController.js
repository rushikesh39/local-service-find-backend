const { Review, Booking, Service } = require("../models");
const { HTTP } = require("../constant");
const { serviceSchema } = require("../schema");
const { ApiError, ApiResponse, asyncHandler, formatZodErrors } = require("../utils");
const { truncates } = require("bcryptjs");

const addService = asyncHandler(async (req, res) => {
  const { data, error } = serviceSchema.add.safeParse(req.body);
  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Form validation failed",
      formatZodErrors(error)
    );
  }
  let { name, description, price, category, address, lat, lng } = data;

  const image = req.file?.path;
  const imagePublicId = req.file?.filename;

  if (!image) {
    throw new ApiError(HTTP.BAD_REQUEST, "Image is Require");
  }

  const providerId = req.user.id;
  await Service.create({
    providerId,
    name,
    description,
    price,
    category,
    image,
    imagePublicId,
    location: {
      type: "Point",
      coordinates: [parseFloat(lng), parseFloat(lat)],
      address,
    },
  });

  res
    .status(HTTP.CREATED)
    .json(new ApiResponse(HTTP.CREATED, "Service added successfully"));
});

const getProviderServices = asyncHandler(async (req, res) => {
  const providerId = req.user.id;
  const services = await Service.find({ providerId });
  if (services.length === 0) {
    throw new ApiError(HTTP.NOT_FOUND, "No Service found");
  }
  res.status(HTTP.Ok).json(new ApiResponse(HTTP.OK, "Service List", services));
});

const updateStatus = asyncHandler(async (req, res) => {
  const { serviceId } = req.body;
  const service = await Service.findOne(serviceId);
  if (!service) {
    throw new ApiError(HTTP.NOT_FOUND, "Service Not Found");
  }
  if (!req.user || service.providerId.toString() !== req.user.id) {
    throw new ApiError(HTTP.FORBIDDEN, "Unauthorized");
  }
  const updatedService = await Service.findByIdAndUpdate(
    serviceId,
    {
      isActive: !service.isActive,
    },
    {
      new: true,
    },
  );

  return res
    .status(HTTP.Ok)
    .json(new ApiResponse(HTTP.OK, "Status updated", updatedService));
});

const getServicesById = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const service = await Service.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(serviceId),
      },
    },

    {
      $lookup: {
        from: "bookings",
        localField: "_id",
        foreignField: "serviceId",
        as: "bookings",
      },
    },

    {
      $lookup: {
        from: "reviews",
        localField: "bookings._id",
        foreignField: "bookingId",
        as: "reviews",
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "reviews.userId",
        foreignField: "_id",
        as: "users",
      },
    },

    {
      $lookup: {
        from: "services",
        let: {
          category: "$category",
          id: "$_id",
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ["$category", "$$category"],
                  },
                  {
                    $ne: ["$_id", "$$id"],
                  },
                  {
                    $eq: ["$isActive", true],
                  },
                ],
              },
            },
          },
          {
            $limit: 4,
          },
        ],
        as: "recommended",
      },
    },
  ]);

  res.status(HTTP.OK).json(new ApiResponse(HTTP.Ok, "Service data", service));
});

const getServices = asyncHandler(async (req, res) => {
  const services = await Service.find({ status: "active" });
  res.status(HTTP.Ok).json(new ApiResponse(HTTP.Ok, "Services", services));
});

const getPopularServices = asyncHandler(async (req, res) => {
  const popular = await Booking.aggregate([
    {
      $group: {
        _id: "$serviceId",
        bookings: {
          $sum: 1,
        },
      },
    },

    {
      $sort: {
        bookings: -1,
      },
    },

    {
      $limit: 4,
    },

    {
      $lookup: {
        from: "services",
        localField: "_id",
        foreignField: "_id",
        as: "service",
      },
    },

    {
      $unwind: "$service",
    },

    {
      $match: {
        "service.isActive": truncates,
      },
    },

    {
      $project: {
        _id: "$service._id",
        name: "$service.name",
        image: "$service.image",
        category: "$service.category",
        location: "$service.location",
        price: "$service.price",
        rating: "$service.rating",
        bookings: 1,
      },
    },
  ]);

  return res
    .status(HTTP.OK)
    .json(new ApiResponse(HTTP.OK, "Popular Services", popular));
});

const getTopRatedServices = asyncHandler(async (req, res) => {
  const limit = 4;
  const topRatedServices = await Service.find({
    rating: { $ne: null },
    status: "active",
  })
    .sort({ rating: -1 })
    .limit(limit);

  res
    .status(HTTP.Ok)
    .json(new ApiResponse(HTTP.Ok, "Top services", topRatedServices));
});

module.exports = {
  addService,
  getProviderServices,
  updateStatus,
  getServicesById,
  getServices,
  getPopularServices,
  getTopRatedServices,
};
