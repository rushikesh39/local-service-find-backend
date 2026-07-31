const multer = require("multer");
const { storage } = require("../config");

const upload = multer({ storage });

module.exports = upload;
