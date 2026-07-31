const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, },
    email: { type: String, unique: true,sparse: true },
    googleId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    mobile: { type: String, unique:true,sparse: true },
    isVerified: { type: Boolean, default: false },
    
    role: { type: String, enum: ["user", "provider","admin"], default: "user" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number]},
      address: { type: String },
    },
    isActive:{type:Boolean,default:true}
  },
  { timestamps: true }
);
module.exports =mongoose.models.User|| mongoose.model("User", userSchema);
