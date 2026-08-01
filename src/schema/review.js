const z = require("zod");
const mongoose=require("mongoose")

const review = z.object({
  ratig: z
    .number()
    .min(0, "Ratig can not less than 0")
    .max(5, "Maximum Rating should be 5"),
  reviewText: z.string(),
  bookingId: z.refine((id) => mongoose.isObjectIdOrHexString(id), {
    message: "Invalid Service ID",
  }),
});

module.exports={
    review
}
