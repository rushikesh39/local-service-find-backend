const Service = require("../models/Service");

exports.searchNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 5000, query } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Latitude and Longitude required" });
    }

    const services = await Service.find({
      category: { $regex: query, $options: "i" }, // match category or service type
      status: "active", // only active services
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius), // meters
        },
      },
    }).populate("providerId", "name email mobile"); // include provider info

    res.json(services);
  } catch (error) {
    console.error("Nearby search failed:", error);
    res.status(500).json({ error: "Server error" });
  }
};
