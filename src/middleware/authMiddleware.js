const { User } = require("../models");
const { ApiError, asyncHandler } = require("../utils");
const { HTTP } = require("../constant");
const mongoose = require("mongoose");

const authMiddleware = asyncHandler(async (req, res, next) => {

  const userId = req.session?.user?.id || req.user?._id;

  if (!userId) {
    throw new ApiError(
      HTTP.UNAUTHORIZED,
      "Unauthorized. Please log in."
    );
  }

  const users = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId)
      }
    },

    // User → Role
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role"
      }
    },

    {
      $unwind: "$role"
    },

    // Role → Permissions
    {
      $lookup: {
        from: "permissions",
        localField: "role.permissionsId",
        foreignField: "_id",
        as: "permissions"
      }
    },

    // Role must be active
    {
      $match: {
        "role.isActive": true
      }
    },

    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        mobile: 1,
        isActive: 1,
        role: 1,
        permissions: 1
      }
    }
  ]);

  if (!users.length) {
    throw new ApiError(
      HTTP.UNAUTHORIZED,
      "User account is inactive or not found"
    );
  }

  const user = users[0];

  if (!user.isActive) {
    throw new ApiError(
      HTTP.UNAUTHORIZED,
      "User account is inactive or not found"
    );
  }

  req.user = user;

  next();
});

module.exports = authMiddleware;