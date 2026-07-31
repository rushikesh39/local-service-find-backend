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
    price: { type: Number, required: true },
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
        type: [Number],
      },
      address: { type: String },
    },

    rating: { type: Number, min: 1, max: 5, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ location: "2dsphere" });
serviceSchema.index({
  name: "text",
  category: "text",
  description: "text",
});

module.exports =mongoose.models.Service ||mongoose.model("Service", serviceSchema);
