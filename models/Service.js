const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
  {
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      address: { type: String },
    },

    rating: { type: Number, min: 1, max: 5, default: null },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

// GeoSpatial index for nearby search
serviceSchema.index({ location: "2dsphere" });

// Text index for full-text search on name, category, description
serviceSchema.index({
  name: "text",
  category: "text",
  description: "text",
});

module.exports = mongoose.model("Service", serviceSchema);
