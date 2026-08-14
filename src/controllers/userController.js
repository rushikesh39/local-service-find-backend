const { HTTP } = require("../constant")
const {User} = require("../models")
const {asyncHandler, ApiResponse}=require("../utils")

const getuserDetails=asyncHandler(async(req,res)=>{
const userId= req.session.user.id

const user= await User.findOne({_id:userId},{_id:0,name:1,email:1, mobile: 1})
res.status(HTTP.OK).json(new ApiResponse(HTTP.OK,"User Details", user))

}) 

module.exports={getuserDetails}