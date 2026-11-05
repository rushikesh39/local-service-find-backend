const { User, OTP, Role } = require("../models");
const { transporter, sms } = require("../config");
const { authSchema } = require("../schema");
const { ApiResponse, ApiError, asyncHandler, formatZodErrors } = require("../utils");
const { HTTP } = require("../constant");

const register = asyncHandler(async (req, res) => {
  const { data, error } = authSchema.register.safeParse(
    req.body,
  );
  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Form Validation Failed!",
      formatZodErrors(error)
    );
  }

  const { name, email, mobile } = data;
  const query = email ? { email } : { mobile };
  const existingUser = await User.findOne(query);

  // Case 1: Already verified
  if (existingUser && existingUser.isVerified) {
    throw new ApiError(HTTP.BAD_REQUEST, "User already Register");
  }

  // Case 2: Already registered but not verified
  if (existingUser && !existingUser.isVerified) {

    const otpResponse = await generateAndSendOtp({ email, mobile, purpose: "register" });

    return res
      .status(HTTP.OK)
      .json(
        new ApiResponse(HTTP.OK, "User not verified. OTP sent successfully."),
      );
  }

  const userRole = await Role.findOne({ name: "user" }).select("_id")
  console.log(userRole)

  // Case 3: New user registration
  const user = await User.create({
    name,
    email,
    mobile,
    roleId: userRole._id,
    isVerified: false,
  });

  const otpResponse = await generateAndSendOtp({ email, mobile, purpose: "register" });


  return res
    .status(HTTP.CREATED)
    .json(new ApiResponse(HTTP.CREATED, "User Created successfully. Please Verify OTP"));
});

const generateAndSendOtp = async ({ email, mobile, purpose }) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  // Delete old OTPs then save new OTP
  await OTP.deleteMany({ $or: [{ email }, { mobile }] });
  await OTP.create({ email, mobile, otp, otpExpires, purpose });

  // Send Email and SMS OTP in parallel (both awaited for reliable delivery)
  const tasks = [];

  if (email) {
    tasks.push(
      transporter.sendMail({
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
                  <p style="font-size: 14px; color: #999;">If you didn't request this, you can safely ignore this email.</p>
             </div>
              <hr style="margin: 30px 0;">
              <p style="font-size: 12px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} Locafy. All rights reserved.</p>
           </div>
  `,
      }).catch((err) => {
        console.error("Email send failed:", err);
        throw new ApiError(HTTP.INTERNAL_SERVER_ERROR, "Failed to send OTP email");
      })
    );
  }

  if (mobile) {
    tasks.push(
      sms.sendOtp(mobile, otp).then((smsResult) => {
        if (!smsResult.success) {
          throw new ApiError(HTTP.INTERNAL_SERVER_ERROR, "Failed to send OTP");
        }
      })
    );
  }

  // Wait for all notifications to complete in parallel
  await Promise.all(tasks);

  return { success: true };
};

const resendOtp = asyncHandler(async (req, res) => {
  const { data, error } = authSchema.sendOtp.safeParse(req.body);
  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Form Validation Failed",
      formatZodErrors(error)
    );
  }
  const { email, mobile, purpose } = data;
  const query = email ? { email } : { mobile };
  const user = await User.findOne(query);

  if (!user) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "User not found. Please register first.",
    );
  }

  // Check existing OTP
  const existingOtp = await OTP.findOne(query);

  if (existingOtp) {
    const timeDiff =
      (Date.now() - new Date(existingOtp.createdAt).getTime()) / 1000;

    if (timeDiff < 30) {
      const waitTime = Math.ceil(120 - timeDiff);
      throw new ApiError(HTTP.TO_MANNY_REQUEST, "Try after some Time");
    }

    // ✅ Otherwise, delete old OTP
    await OTP.deleteOne(query);
  }

  // ✅ Generate and send a new OTP
  const otpResponse = await generateAndSendOtp({ email, mobile, purpose });

  if (!otpResponse.success) {
    throw new ApiError(
      HTTP.INTERNAL_SERVER_ERROR,
      "Failed to generate OTP",
      otpResponse.error,
    );
  }
  return res.status(HTTP.OK).json(new ApiResponse(HTTP.OK, "OTP resent successfully!"));
});

const verifyOtp = asyncHandler(async (req, res) => {
  const { data, error } = authSchema.verifyOtp.safeParse(req.body);
  if (error) {
    throw new ApiError(
      HTTP.BAD_REQUEST,
      "Form Validation Failed",
      formatZodErrors(error)
    );
  }
  const { email, mobile, otp } = data;
  const query = email ? { email } : { mobile };
  const otpEntry = await OTP.findOne(query);

  if (!otpEntry) {
    throw new ApiError(HTTP.BAD_REQUEST, "OTP Expire. Please resend.");
  }

  if (otpEntry.otp !== otp) {
    otpEntry.attempts += 1;

    if (otpEntry.attempts >= 3) {
      await OTP.deleteOne(query);
      throw new ApiError(
        HTTP.BAD_REQUEST,
        "Too many incorrect attempts. Resend OTP.",
      );
    }
    await otpEntry.save();
    throw new ApiError(
      HTTP.BAD_REQUEST,
      `Invalid OTP. ${3 - otpEntry.attempts} attempts remaining.`,
    );
  }

  // ✅ OTP is correct — verify user
  const user = await User.findOneAndUpdate(
    query,
    { isVerified: true },
    { new: true },
  );
    req.session.user = {
    id: user._id
  };
  if (email && otpEntry.purpose === "register") {
    sendRegistrationMail(email, user.name)

    return res
      .status(HTTP.OK)
      .json(new ApiResponse(HTTP.OK, "Register Sucessfully"));
  }
  if (otpEntry.purpose === "login") {
    return res
      .status(HTTP.OK)
      .json(new ApiResponse(HTTP.OK, "Login Sucessfully"));
  } else if (!otpEntry.purpose) {
    throw new ApiError(HTTP.BAD_REQUEST, "Purpose Not defind")
  }
});

const sendRegistrationMail = async (email, name) => {
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
            <a href="${process.env.FRONTEND_URL
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
};

const login = asyncHandler(async (req, res) => {
  const { data, error } = authSchema.login.safeParse(
    req.body,
  );
  if (error) {
    throw new ApiResponse(
      HTTP.BAD_REQUEST,
      "Form validation failed",
      formatZodErrors(error)
    );
  }
  const { email, mobile } = data;
  const query = email ? { email } : { mobile }

  const user = await User.findOne(query);
  if (!user) {
    throw new ApiError(HTTP.BAD_REQUEST, "User not found.");
  }
  await generateAndSendOtp({ email, mobile, purpose: "login" });

  return res
    .status(HTTP.OK)
    .json(new ApiResponse(HTTP.OK, "OTP sent successfully. Please verify to login."));

});
const socialLoginCallback = asyncHandler(async (req, res, next) => {
  req.session.user = {
    email: req.user.email,
  };
  req.session.save((err) => {
    if (err) return next(err);
    res.redirect("https://rushi-locafy.netlify.app/api/social-auth-success");
  });
});

const logout = asyncHandler(async (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy((err) => {
      if (err) {
        return next(
          new ApiError(
            HTTP.INTERNAL_SERVER_ERROR,
            "Failed to logout"
          )
        );
      }

      res.clearCookie("connect.sid");

      return res
        .status(HTTP.OK)
        .json(new ApiResponse(HTTP.OK, "Logout successful"));
    });
  });
});

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  socialLoginCallback,
  logout,
};
