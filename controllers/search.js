// controllers/providerController.js
const Services = require("../models/Services");

exports.search = async (req, res) => {
  let { location, query } = req.query;
  location = location?.trim();
  query = query?.trim();
  console.log("location",location,query)
  try {
    if (!location || !query) {
      return res.status(400).json({ error: "Location and query are required" });
    }

    const providers = await Services.find({
      $and: [
        { location: { $regex: location, $options: "i" } },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { category: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
          ]
        }
      ]
    });

    res.status(200).json(providers);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
