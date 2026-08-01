const { transporter} = require("../config");
const { HTTP } = require("../constant");
const { contactSchema } = require("../schema");
const {ApiError,ApiResponse,asyncHandler}=require("../utils");

const contactUs = asyncHandler(async (req, res) => {
  const {data, error}=contactSchema.contact.safeParse(req.body);
  if(error){
    throw new ApiError(HTTP.FORBIDDEN,"Contact Form validation Failed", error.flatten().fieldErrors)
  }
  const { name, email, subject, message } = data;

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

    res.status(HTTP.OK).json(new ApiResponse(HTTP.OK,"Mail send successfully"));
  })

module.exports={contactUs}