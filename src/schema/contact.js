const z=require('zod')

const contact=z.object({
    name:z.string().min(1,"Name is Require"),
    email: z
          .string()
          .trim()
          .email()
          .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid Email"),
    subject:z.string().min(1,"Subject is Require"),
    message:z.string().min(1,"Message is Require")
})

module.exports={
    contact
}