const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP=require("../models/OTP")
const nodemailer = require("nodemailer");
const transporter = require("../config/nodemail");
const { use } = require("passport");

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All field required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (!existingUser.isVerified) {
        return res.status(403).json({
          message: "Email already registered but not verified. Please verify your email.",
          unverified: true,
          user: {
            _id: existingUser._id,
            email: existingUser.email,
            name: existingUser.name,
            role: existingUser.role,
          },
        });
      }
      return res.status(400).json({ message: "Email already registered!" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || "user",
      isVerified: false,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name, role: user.role },
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
    res.status(500).json({ message:err });
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
  from: `"Locafy " <${process.env.EMAIL_USER}>`,
  subject: "Verify Your Email - OTP Code",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
      <div style="text-align: center;">
        <h2 style="color: #333;">🔐 Email Verification</h2>
        <p style="font-size: 16px; color: #555;">Use the OTP below to verify your email address:</p>
        <div style="margin: 20px auto; padding: 10px 20px; background-color: #ffffff; border: 2px dashed #4caf50; display: inline-block; border-radius: 5px;">
          <p style="font-size: 24px; font-weight: bold; color: #4caf50; letter-spacing: 4px;">${otp}</p>
        </div>
        <p style="color: #888;">This OTP is valid for <strong>5 minutes</strong>.</p>
        <p style="font-size: 14px; color: #999;">If you didn’t request this, you can safely ignore this email.</p>
      </div>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} Locafy. All rights reserved.</p>
    </div>
  `
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

    const user = await User.findOne({ email });
     await sendRegistrationMail(user.email, user.name);
    res.status(200).json({ message: "Email verified successfully" });
     
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error while verifying OTP" });
  }
};
// Send Registration Success Email (Enhanced Design)
const sendRegistrationMail = async (email, name) => {
  try {
    await transporter.sendMail({
      to: email,
      from: `"Locafy Support" <${process.env.EMAIL_USER}>`,
      subject: "🎉 Welcome to Locafy - Your Registration is Complete!",
      html: `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 600px; margin: 20px auto; padding: 25px; background: #ffffff; border-radius: 12px; border: 1px solid #e0e0e0; box-shadow: 0px 4px 12px rgba(0,0,0,0.05);">
        <div style="text-align: center;">
          <img src="https://rushi-locafy.netlify.app/main-logo.png" alt="Locafy Logo" width="120" style="margin-bottom: 15px;">
          <h2 style="color: #28a745; font-size: 24px; margin-bottom: 10px;">Welcome to Locafy, ${name}! 🎉</h2>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            We're thrilled to have you on board! Your account has been successfully 
            <strong style="color:#28a745;">registered and verified</strong>.
          </p>
          <p style="font-size: 16px; color: #444; line-height: 1.6;">
            Start exploring trusted service providers in your area with just a few clicks.
          </p>
          <a href="${process.env.FRONTEND_URL}/login" 
             style="display:inline-block; margin: 20px auto; padding: 14px 28px; background-color: #28a745; color: #fff; font-size: 18px; font-weight: bold; text-decoration: none; border-radius: 6px; transition: 0.3s;">
             🔑 Login to Your Account
          </a>
        </div>
        <div style="margin-top: 25px; padding: 15px; background-color: #f9f9f9; border-radius: 8px; text-align: center;">
          <p style="font-size: 14px; color: #666; margin: 0;">
            Need help getting started? Visit our 
            <a href="${process.env.FRONTEND_URL}/help" style="color: #007bff; text-decoration: none;">Help Center</a> 
            or contact our support team.
          </p>
        </div>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #aaa; text-align: center; line-height: 1.5;">
          You received this email because you signed up on Locafy.<br>
          If this wasn't you, please ignore this message.<br>
          &copy; ${new Date().getFullYear()} Locafy. All rights reserved.
        </p>
      </div>
      `,
    });
  } catch (error) {
    console.error("Registration email send error:", error);
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

const contactUs = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message||!subject) {
    return res.status(400).json({ error: "Name, email, and message are required." });
  }

  try {
    await transporter.sendMail({
      to: process.env.EMAIL_USER,
      from: email,
      subject: subject || "New Contact Form Submission",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>📩 New Contact Message</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
          <hr>
          <p style="font-size: 12px; color: #999;">This message was sent via the Locafy Contact Form.</p>
        </div>
      `,
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({ error: "Failed to send message." });
  }
};


module.exports = { registerUser, sendOtp, verifyOtp, loginUser,contactUs };
