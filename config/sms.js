import axios from "axios";

/**
 * Send OTP using Fast2SMS OTP route
 * @param {string} mobile - Recipient mobile number (10-digit)
 * @param {string} otp - OTP code to send
 */
export const sendSmsOtp = async (mobile, otp) => {
  try {
    const url = "https://www.fast2sms.com/dev/bulkV2"; // same endpoint works with route=otp

    const data = {
      route: "otp",
      variables_values: otp,
      numbers: mobile,
    };

    const response = await axios.post(url, data, {
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (response.data.return === true) {
      console.log("✅ OTP sent successfully to:", mobile);
      return { success: true, message: "OTP sent successfully" };
    } else {
      console.log("❌ OTP sending failed:", response.data);
      return { success: false, message: "Failed to send OTP via Fast2SMS" };
    }
  } catch (error) {
    console.error(
      "⚠️ Fast2SMS OTP Error:",
      error.response?.data || error.message
    );
    return { success: false, message: "Fast2SMS API error" };
  }
};
