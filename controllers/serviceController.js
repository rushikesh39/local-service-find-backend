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

const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, location } = req.body;
    const service = await Service.findById(id);

    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (req.user && service.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Update fields
    if (name) service.name = name;
    if (description) service.description = description;
    if (category) service.category = category;
    if (price) service.price = price;
    if (location) service.location = location;

    // If new image uploaded, delete old and update
    if (req.file?.path && req.file?.filename) {
      // 🔥 Delete old image from Cloudinary
      await cloudinary.uploader.destroy(service.imagePublicId);

      // ✅ Set new image URL and public_id
      service.image = req.file.path;
      service.imagePublicId = req.file.filename;
    }

    const updatedService = await service.save();
    res.json({ message: "Service updated", service: updatedService });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ message: "Server error" });
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

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    // Authorization check (optional)
    if (req.user && service.providerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    if (service.imagePublicId) {
      await cloudinary.uploader.destroy(service.imagePublicId);
    }
    await service.deleteOne();
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
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
    const limit = 5;
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
    const services = await Service.find({ _id: { $in: serviceIds } });

    // Merge booking count with service info
    const result = popular.map((p) => {
      const service = services.find(
        (s) => s._id.toString() === p._id.toString()
      );
      return {
        _id: p._id,
        name: service?.name || "Unknown",
        category: service?.category || "",
        price: service?.price || 0,
        image: service?.image || "",
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

module.exports = {
  addService,
  getServices,
  updateService,
  getServicesById,
  deleteService,
  servicesList,
  getPopularServices,
};
