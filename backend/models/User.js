const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: "",
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  password: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    trim: true,
    default: "",
  },

  favorites: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
    },
  ],

  isAdmin: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("User", userSchema);
