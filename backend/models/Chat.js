const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    home: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Home",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);