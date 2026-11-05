const { HTTP } = require("../constant")
const { User } = require("../models")
const { asyncHandler, ApiResponse, ApiError } = require("../utils")
const mongoose = require('mongoose')

const getuserDetails = asyncHandler(async (req, res) => {
  const userId=req.session.user.id;
  const user= await User.aggregate([{
    $match:{_id: new mongoose.Types.ObjectId(userId)}
  },{
    $lookup:{
      from:"roles",
      localField:"roleId",
      foreignField:"_id",
      as:"role"
    }
  },{
    $unwind:"$role"
  },{
    $lookup:{
      from:"permissions",
      localField:"role.permissionsId",
      foreignField:"_id",
      as:"permissions"
    }
  },{
    $project:{
       _id: 1,
    name: 1,
    email: 1,
    mobile: 1,
    role: "$role.name",
    permissions: "$permissions.key"
    }
  }])

  if (!user) {
    throw new ApiError(
      HTTP.NOT_FOUND,
      "User not found"
    );
  }
  return res.status(HTTP.OK).json(
    new ApiResponse(
      HTTP.OK,
      "Current user fetched successfully",
      user[0]
    )
  );
});

module.exports = { getuserDetails }