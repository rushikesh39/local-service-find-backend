const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    mobile: { type: String },
    passwordHash: { type: String },
    address: { type: String, default: "" },
    isVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "provider"],
      default: "user",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
