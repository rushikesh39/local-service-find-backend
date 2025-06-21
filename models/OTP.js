const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: String,
  otp: String,
  otpExpires: Date,
});

module.exports = mongoose.model("OTP", otpSchema);
