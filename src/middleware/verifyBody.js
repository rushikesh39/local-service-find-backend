const validatePostBody = (req, res, next) => {
  if (req.method === "POST") {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).send({
        success: false,
        message: "Request body is required",
      });
    }
  }

  next();
};

module.exports = validatePostBody;