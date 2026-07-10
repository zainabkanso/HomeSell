const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "video", "voice", "location"],
      default: "text",
    },

    text: {
      type: String,
      default: "",
      trim: true,
    },

    fileUrl: {
      type: String,
      default: "",
    },
    location: {
      url: {
        type: String,
        default: "",
      },
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    edited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
