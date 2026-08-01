const z=require("zod")

const add=z.object({
    name:z.string().trim().min(3,"Service name At list 3 character long"),
    description:z.string().trim(),
    price:z.number().min(1,"Price must be greater than 0"),
    category:z.string().trim(),
    address:z.string().trim(),
    lat:z.number(),
    lng:z.number(),
})

module.exports={
    add
}