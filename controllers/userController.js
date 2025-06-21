const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP=require("../models/OTP")
const nodemailer = require("nodemailer");
const transporter = require("../config/nodemail");
const { use } = require("passport");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role} = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All field required" });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered !" });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "user",
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email,name:user.name,role:user.role},
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: `${role === "provider" ? "Provider" : "User"} registered successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
// Send OTP
const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const existing = await OTP.findOne({ email });
    if (existing) await OTP.deleteOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await OTP.create({ email, otp, otpExpires });

    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: "OTP Verification",
      html: `<h3>Your OTP is <strong>${otp}</strong></h3><p>Valid for 10 minutes</p>`,
    });

    res.status(200).json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const otpEntry = await OTP.findOne({ email });

    if (!otpEntry) return res.status(404).json({ message: "OTP not found for this email" });
    if (otpEntry.otp !== otp || otpEntry.otpExpires < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    await User.findOneAndUpdate({ email }, { isVerified: true });
    await OTP.deleteOne({ email });

    res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error while verifying OTP" });
  }
};
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({ error: "Email not verified. Please verify your email before logging in." });
    }
    const {name,role } = user;

    const token = jwt.sign(
      { userId: user._id, email: user.email,name:name,role:role },
      process.env.JWT_SECRET,
      { expiresIn: "15d" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Error logging in" });
  }
};



module.exports = { registerUser, sendOtp, verifyOtp, loginUser };
