const z = require("zod");
const mongoose=require("mongoose")

const bookService = z.object({
  serviceId: z.string().refine((id) => mongoose.isObjectIdOrHexString(id), {
    message: "Invalid Service ID",
  }),
  name: z.string().min(1, "Service Name is Require"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid Mobile No."),
  scheduleDate: z.coerce.date().refine((date) => date > new Date(), {
    message: "Booking date must be in the future",
  }),
  address: z.string().min(1, "Address is Required"),
  notes: z.string().optional(),
});

const updateStatus=z.object({
    id:z.string().refine((id) => mongoose.isObjectIdOrHexString(id), {
    message: "Invalid Service ID",
  }),
  status:z.enum(["pending", "confirmed", "cancelled", "completed"],{error:"Invalid Status"})
})

module.exports={
    bookService,
    updateStatus
}
