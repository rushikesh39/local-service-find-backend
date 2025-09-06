const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    mobile: { type: String },
    passwordHash: { type: String },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "provider"], default: "user" },
    location: { type: String },
    // location: {
    //   type: { type: String, enum: ["Point"], default: "Point" },
    //   coordinates: { type: [Number]},
    //   address: { type: String },
    // },
  },
  { timestamps: true }
);
// userSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("User", userSchema);
