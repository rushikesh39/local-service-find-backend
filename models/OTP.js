const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: { type: String},
  mobile: { type: String },
  otp: { type: String, required: true },
  otpExpires: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 }

});
otpSchema.pre("save", function (next) {
  if (!this.email && !this.mobile) {
    return next(new Error("Either email or mobile must be provided for OTP"));
  }
  next();
});

module.exports = mongoose.model("OTP", otpSchema);
