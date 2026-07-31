const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String},
  mobile: { type: String },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  purpose:{type:String,enum:["login","register"]},
  createdAt: { type: Date, default: Date.now, expires: 300 }

});

module.exports =mongoose.models.OTP ||mongoose.model("OTP", otpSchema);
