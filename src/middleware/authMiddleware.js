const {User} =require("../models")
const { ApiResponse, ApiError, asyncHandler } = require("../utils");
const { HTTP } = require("../constant");

const authMiddleware = asyncHandler(async (req, res, next) => {
  if(!req.session.user){
    throw new ApiError(HTTP.BAD_REQUEST,"Unauthorized")
  }

  const user= await User.findById(req.session.user);

  if(!user){
    throw new ApiError(HTTP.NOT_FOUND,"User not Found")
  }
    next();
  })
module.exports = authMiddleware;
