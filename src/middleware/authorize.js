const mongoose = require("mongoose");
const { User } = require("../models");
const { ApiError, asyncHandler } = require("../utils");
const { HTTP } = require("../constant");

const authorize = (permissionKey) =>
  asyncHandler(async (req, res, next) => {
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
        localField:"role.permissionId",
        foreignField:"_id",
        as:"permissions"
      }
    },{
      $match:{"permissions.isActive":true}
    },{
      $project:{
        _id:1,
        role:"$role.name",
        permissions:"$permissions.key"
      }
    }])

    if (!user) {
      throw new ApiError(
        HTTP.NOT_FOUND,
        "User not found"
      );
    }

    const hasPermission = user[0].permissions.includes(permissionKey)
    if (!hasPermission) {
      throw new ApiError(
        HTTP.FORBIDDEN,
        "You do not have permission to perform this action"
      );
    }

    next();
  });

module.exports = authorize;