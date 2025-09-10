const Services = require("../models/Services");

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

exports.search = async (req, res) => {
  const { location, query } = req.query;
  try {
    if (!location || !query) {
      return res.status(400).json({ error: "Location and query are required" });
    }

    const providers = await Services.find({
      $and: [
        {
          $or: [
            { location: { $regex: location, $options: "i" } }, 
            { "location.address": { $regex: location, $options: "i" } }, 
          ],
        },

        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
          ],
        },
      ],
    });

    res.status(200).json(providers);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
