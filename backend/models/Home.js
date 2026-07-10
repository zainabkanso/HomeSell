const mongoose = require("mongoose");

const homeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  bedrooms: {
    type: Number,
    required: true,
  },
  bathrooms: {
    type: Number,
    required: true,
  },
  area: {
    type: Number,
    required: true,
  },
  images: {
    type: [String],
    default: [],
  },
  mainImage: {
    type: String,
    default: "",
  },

  videos: {
    type: [String],
    default: [],
  },
  ownerPhone: {
  type: String,
  required: true,
  validate: {
    validator: function (phone) {
      const cleaned = phone.replace(/[\s\-()]/g, "");

      return /^(?:\+961|00961|961)?(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$|^0(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$/.test(cleaned);
    },
    message: "Owner phone must be a valid Lebanese phone number.",
  },
},
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["draft", "published"],
    default: "published",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Home", homeSchema);
