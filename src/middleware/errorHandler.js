const {ApiError}= require("../utils")
const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err);

  // Known application error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors
    });
  }

  // Unknown / unexpected error
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Something went wrong. Please try again later.",
    errors: null
  });
};

module.exports = errorHandler;