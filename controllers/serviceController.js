const Service = require("../models/Services");
const User = require("../models/User");
const Booking = require("../models/Booking");
const { cloudinary } = require("../config/cloudinary");

const addService = async (req, res) => {
  try {
    const providerId = req.user.id;

    const { name, description, price, category, location } = req.body;

    // ✅ Get image URL from Cloudinary
    const image = req.file?.path;
    const imagePublicId = req.file?.filename;

    // Validation
    if (!name || !description || !price || !category || !location || !image) {
      return res
        .status(400)
        .json({ error: "All fields are required including image" });
    }

    // Optional: Check if provider exists
    const providerExists = await User.findById(providerId);
    if (!providerExists) {
      return res.status(404).json({ error: "Service provider not found" });
    }

    const newService = new Service({
      providerId,
      name,
      description,
      price,
      category,
      image, // ✅ Cloudinary image URL
      imagePublicId,
      location,
    });

    await newService.save();

    res
      .status(201)
      .json({ message: "Service added successfully", service: newService });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getServices = async (req, res) => {
  try {
    const { providerId } = req.params;

    const services = await Service.find({ providerId });

    res.status(200).json({ services });
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { serviceId } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    if (!req.user || service.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    service.status = service.status === "active" ? "inactive" : "active";
    await service.save();

    return res.status(200).json({
      message: `Service status changed to '${service.status}'`,
      status: service.status, 
    });
  } catch (error) {
    console.error("Service status toggle failed:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getServicesById = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById({ _id: serviceId });

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json({ service });
  } catch (err) {
    console.error("Error fetching service:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const servicesList = async (req, res) => {
  try {
    const services = await Service.find();

    res.status(200).json({ services });
  } catch (err) {
    console.error("Error fetching services:", err);
    res.status(500).json({ message: "Server error" });
  }
};
const getPopularServices = async (req, res) => {
  try {
    const limit = 4;
    const popular = await Booking.aggregate([
      {
        $group: {
          _id: "$serviceId",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    // Extract service IDs
    const serviceIds = popular.map((item) => item._id);

    // Fetch service details
    const services = await Service.find({ _id: { $in: serviceIds }, status: "active" });

    // Merge booking count with service info
    const result = popular.map((p) => {
      const service = services.find(
        (s) => s._id.toString() === p._id.toString()
      );
      return {
        _id: p._id,
        name: service?.name,
        category: service?.category,
        location: service?.location,
        price: service?.price,
        image: service?.image,
        rating: service?.rating,
        count: p.count,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("Error getting popular services:", err);
    res
      .status(500)
      .json({ message: "Server error while fetching popular services" });
  }
};

const getTopRatedServices = async (req, res) => {
  try {
    const limit = 4;

    const topRatedServices = await Service.find({
      rating: { $ne: null },
      status: "active",
    })
      .sort({ rating: -1 })
      .limit(limit);

    res.status(200).json(topRatedServices);
  } catch (error) {
    console.error("Error fetching top-rated services:", error);
    res.status(500).json({ message: "Server error while fetching top-rated services" });
  }
};


module.exports = {
  addService,
  getServices,
  updateStatus,
  getServicesById,
  servicesList,
  getPopularServices,
  getTopRatedServices
};
