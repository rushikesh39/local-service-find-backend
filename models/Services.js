const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceProvider", required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  imagePublicId: {  type: String,  required: true,},
  location:{type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Service", serviceSchema);
