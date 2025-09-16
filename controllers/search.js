const Services = require("../models/Services");

exports.search = async (req, res) => {
  try {
    const { lat, lng, radius,  query } = req.query;

    // Case 1: If user provided coordinates → nearby search
    if (lat && lng && query) {
      const services = await Services.find(
        {
          status: "active",
          $text: { $search: query }, // ✅ text index search
          location: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [parseFloat(lng), parseFloat(lat)], // [lng, lat]
              },
              $maxDistance: parseInt(radius) || 10000, // default 10 km
            },
          },
        },
        {
          score: { $meta: "textScore" }, // include relevance score
        }
      )
        .sort({ score: { $meta: "textScore" } }) // sort by relevance
        .populate("providerId", "name email mobile");

      return res.json(services);
    }

    // Case 2: If coordinates denied →  query search
    if (!query) {
      return res.status(400).json({ error: "Enter a service are required" });
    }

    const providers = await Services.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });

    return res.status(200).json(providers);
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: "Server error" });
  }
};
