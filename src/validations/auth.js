const z = require("zod");

const register = z
  .object({
    name: z
      .string()
      .min(3, "Name should be at list 3 Character")
      .max(30, "Name should not be greater than 30 Character")
      .trim(),
    mobile: z
      .string()
      .regex(/^[6-9]\d{9}$/, "Invalid Mobile No.")
      .optional()
      .or(z.literal("")),
    email: z
      .string()
      .email()
      .trim()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Email")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.email.trim() !== "" || data.mobile.trim() !== "", {
    message: "Email or mobile number is required",
    path: ["email"],
  });

const login = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Email")
      .optional()
      .or(z.literal("")),
    monbile: z
      .string()
      .trim()
      .regex(/^[6-9]\d{9}$/, "Invalid Mobile No.")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.email.trim() !== "" || data.mobile.trim() !== "", {
    message: "Email or mobile number is required",
    path: ["email"],
  });

const verifyOtp = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid Mobile No.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Email")
    .optional()
    .or(z.literal("")),
    otp:z.string().trim().min(6,"Invalid OTP")
}).refine((data) => data.email.trim() !== "" || data.mobile.trim() !== "", {
    message: "Email or mobile number is required",
    path: ["email"],
  });

  const sendOtp = z.object({
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Invalid Mobile No.")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .trim()
    .email()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Email")
    .optional()
    .or(z.literal("")),
}).refine((data) => data.email.trim() !== "" || data.mobile.trim() !== "", {
    message: "Email or mobile number is required",
    path: ["email"],
  });

module.exports = {
  login,
  register,
  verifyOtp,
  sendOtp
};
