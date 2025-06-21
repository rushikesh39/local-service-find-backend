const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    serviceType: { type: String, required: true }, // e.g., plumber
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    location: { type: String, required: true }, // Human-readable address
    isVerified: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Enable geospatial index for "near me" queries
providerSchema.index({ coordinates: "2dsphere" });

module.exports = mongoose.model("ServiceProvider", providerSchema);
