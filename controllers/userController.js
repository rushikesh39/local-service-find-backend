const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OTP = require("../models/OTP");
const transporter = require("../config/nodemail");
const { use } = require("passport");
const { sendSmsOtp } = require("../config/sms");

const registerUser = async (req, res) => {
  try {
    const { name, mobile, email, password, role } = req.body;

    if (!name || (!email && !mobile))
      return res
        .status(400)
        .json({ message: "Name and either Email or Mobile are required." });

    if (email && !password)
      return res
        .status(400)
        .json({ message: "Password is required when using email." });

    const query = {};
    if (email) query.email = email;
    if (mobile) query.mobile = mobile;

    const existingUser = await User.findOne(query);

    // Case 1: Already verified
    if (existingUser && existingUser.isVerified) {
      return res.status(409).json({ message: "User already registered.",isVerified:existingUser.isVerified });
    }

    // Case 2: Already registered but not verified
    if (existingUser && !existingUser.isVerified) {
      const otpResponse = await generateAndSendOtp({ email, mobile });

      if (!otpResponse.success) {
        return res.status(503).json({
          message: otpResponse.error,
          unverified: true,
        });
      }

      return res.status(409).json({
        message:
          "User already registered but not verified. OTP resent successfully.",
        unverified: true,
        userId: existingUser._id,
      });
    }

    // Case 3: New user registration
    const passwordHash = email ? await bcrypt.hash(password, 10) : undefined;
    const user = await User.create({
      name,
      email,
      mobile,
      passwordHash,
      role: role || "user",
      isVerified: false,
    });

    // Send OTP
    const otpResponse = await generateAndSendOtp({ email, mobile });

    // If OTP sending fails -> rollback user creation
    if (!otpResponse.success) {
      await User.deleteOne({ _id: user._id });
      return res.status(503).json({
        message:
          "User registration failed due to OTP service temparary unavailable. Please try again later or use Email.",
      });
    }

    if (email) {
      await sendRegistrationMail({
        to: email,
        name,
      });
    }

    return res.status(201).json({
      message: "User registered successfully. Please verify with OTP.",
      userId: user._id,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const generateAndSendOtp = async ({ email, mobile }) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

    // Delete old OTPs for same user
    await OTP.deleteMany({ $or: [{ email }, { mobile }] });

    // Save new OTP
    await OTP.create({ email, mobile, otp, otpExpires });

    // Send Email OTP
    if (email) {
      await transporter.sendMail({
        to: email,
        from: `"Locafy " <${process.env.EMAIL_USER}>`,
        subject: "Verify Your Email - OTP Code",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
                <div style="text-align: center;">
                    <h2 style="color: #333;">🔐 Email Verification</h2>
                    <p style="font-size: 16px; color: #555;">Use the OTP below to verify your email address:</p>
                    <div style="margin: 20px auto; padding: 10px 20px; background-color: #ffffff; border: 2px     dashed #4caf50; display: inline-block; border-radius: 5px;">
                        <p style="font-size: 24px; font-weight: bold; color: #4caf50; letter-spacing: 4px;">${otp}</p>
                      </div>
                  <p style="color: #888;">This OTP is valid for <strong>5 minutes</strong>.</p>
                  <p style="font-size: 14px; color: #999;">If you didn’t request this, you can safely ignore this email.</p>
             </div>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} Locafy. All rights reserved.</p>
           </div>
  `,
      });
    }

    // Send SMS OTP (if applicable)
    if (mobile) {
      const smsResult = await sendSmsOtp(mobile, otp);

      if (!smsResult.success) {
        console.warn("❌ SMS OTP not sent:", smsResult.message);
        return { success: false, error: smsResult.message }; 
      }
    }

    return { success: true, otp }; // ✅ OTP sent successfully
  } catch (error) {
    console.error("❌ OTP Generation/Sending Error:", error);
    return {
      success: false,
      error: "Failed to send OTP. Please try again later.",
    };
  }
};
const resendOtp = async (req, res) => {
  try {
    const { email, mobile } = req.body;
    if (!email && !mobile)
      return res.status(400).json({ message: "Email or Mobile is required." });

    const query = email ? { email } : { mobile };
    const user = await User.findOne(query);

    if (!user)
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });

    // ✅ Check existing OTP
    const existingOtp = await OTP.findOne(query);

    if (existingOtp) {
      const timeDiff =
        (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000; // in seconds

      // ✅ If OTP was created less than 2 minutes ago → block resend
      if (timeDiff < 120) {
        const waitTime = Math.ceil(120 - timeDiff);
        return res.status(429).json({
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
        });
      }

      // ✅ Otherwise, delete old OTP
      await OTP.deleteOne(query);
    }

    // ✅ Generate and send a new OTP
    const otpResponse = await generateAndSendOtp({ email, mobile });

    if (!otpResponse.success) {
      return res.status(503).json({ message: otpResponse.error });
    }

    return res.status(200).json({ message: "OTP resent successfully!" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res
      .status(500)
      .json({ message: "Server error while resending OTP." });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, mobile, otp } = req.body;
    console.log(email, mobile, otp);

    // ✅ Validate input
    if ((!email && !mobile) || !otp) {
      return res
        .status(400)
        .json({ message: "Email or Mobile and OTP are required." });
    }

    // ✅ Find OTP entry
    const query = email ? { email } : { mobile };
    const otpEntry = await OTP.findOne(query);

    if (!otpEntry) {
      return res.status(404).json({ message: "OTP not found. Please resend." });
    }

    // ✅ Check if OTP expired
    if (otpEntry.otpExpires < new Date()) {
      await OTP.deleteOne(query);
      return res.status(400).json({ message: "OTP expired. Please resend." });
    }

    // ✅ Check OTP match
    if (otpEntry.otp !== otp) {
      otpEntry.attempts += 1;

      // ❌ If user exceeds 3 attempts, delete OTP and deny further tries
      if (otpEntry.attempts >= 3) {
        await OTP.deleteOne(query);
        return res
          .status(400)
          .json({ message: "Too many incorrect attempts. Resend OTP." });
      }

      await otpEntry.save();
      return res.status(400).json({
        message: `Invalid OTP. ${3 - otpEntry.attempts} attempts remaining.`,
      });
    }

    // ✅ OTP is correct — verify user
    const user = await User.findOneAndUpdate(
      query,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // ✅ Delete OTP after successful verification
    await OTP.deleteOne(query);

    // ✅ Generate JWT
    const token = jwt.sign(
      {
        userId: user._id,
        name:user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15d" }
    );

    return res.status(200).json({
      message: "Verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res
      .status(500)
      .json({ message: "Server error while verifying OTP" });
  }
};

// Send Registration Success Email
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
            <a href="${
              process.env.FRONTEND_URL
            }/help" style="color: #007bff; text-decoration: none;">Help Center</a> 
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
    const { email, mobile, password} = req.body;
    console.log(req.body)
    // ✅ Case 1: Email login
    if (email) {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ error: "User not found with this email." });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch)
        return res.status(400).json({ error: "Invalid credentials." });

      if (!user.isVerified) {
        return res.status(403).json({
          error:
            "Email not verified. Please verify your email before logging in.",
        });
      }

      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "15d" }
      );

      return res
        .status(200)
        .json({ message: "Login successful.", token, user });
    }

    // ✅ Case 2: Mobile login → send OTP
    if (mobile) {
      const user = await User.findOne({ mobile });
      if (!user)
        return res.status(404).json({
          error: "Mobile number not found. Please register first.",
        });

      // Generate OTP and send
      const otpResponse = await generateAndSendOtp({ mobile });

      if (!otpResponse.success) {
        return res.status(503).json({
          error: otpResponse.error || "Failed to send OTP. Try again later.",
        });
      }

      return res.status(200).json({
        message: "OTP sent successfully to your mobile number.",
      });
    }

    // If neither email nor mobile provided
    return res
      .status(400)
      .json({ error: "Please provide email or mobile to login." });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error while logging in." });
  }
};

const contactUs = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message || !subject) {
    return res
      .status(400)
      .json({ error: "Name, email, and message are required." });
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

module.exports = { registerUser, verifyOtp, resendOtp, loginUser, contactUs };
