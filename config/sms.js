const axios = require("axios");
require("dotenv").config();

/**
 * Send OTP via Fast2SMS
 * @param {string} mobile - recipient's 10-digit Indian number
 * @param {string} otp - OTP code (6 digits)
 */
const sendSmsOtp = async (mobile, otp) => {
  try {
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) throw new Error("FAST2SMS_API_KEY not found in .env");

    // 👇 Compose Quick-SMS URL (route=q → instant test route)
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${encodeURIComponent(apiKey)}&route=q&message=${encodeURIComponent(
      `Your Locafy verification OTP is ${otp}. It is valid for 5 minutes.`
    )}&language=english&numbers=${encodeURIComponent(mobile)}`;

    const response = await axios.get(url, { headers: { "cache-control": "no-cache" } });

    console.log("📤 Fast2SMS Response:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Fast2SMS Error:", error.response?.data || error.message);
    throw new Error("Failed to send OTP via Fast2SMS");
  }
};

module.exports = { sendSmsOtp };
