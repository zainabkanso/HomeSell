const Chat = require("../models/Chat");
const Message = require("../models/Message");
const Home = require("../models/Home");

exports.startChat = async (req, res) => {
  try {
    const homeId = req.params.homeId;
    const buyerId = req.userId;

    const home = await Home.findById(homeId);
    console.log("HOME:", home);
    console.log("BUYER:", buyerId);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    const ownerId = home.owner;
    console.log("OWNER:", ownerId);

    if (!buyerId || !ownerId) {
      return res.status(400).json({
        message: "Missing buyer or owner id",
      });
    }
    if (buyerId.toString() === ownerId.toString()) {
      return res.status(400).json({
        message: "You cannot chat with yourself",
      });
    }

    let chat = await Chat.findOne({
      home: homeId,
      participants: {
        $all: [buyerId, ownerId],
      },
    });

    if (!chat) {
      chat = await Chat.create({
        home: homeId,
        participants: [buyerId, ownerId],
      });
    }

    res.json(chat);
  } catch (error) {
    res.status(500).json({
      message: "Could not start chat",
      error: error.message,
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.userId,
    });

    if (!chat) {
      return res.status(403).json({
        message: "You are not allowed to view this chat",
      });
    }

    const messages = await Message.find({
      chat: chatId,
    })
      .populate("sender", "email")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: "Could not load messages",
      error: error.message,
    });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const chatId = req.params.chatId;
    const userId = req.userId;
    const { text, type, locationUrl } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    });

    if (!chat) {
      return res.status(403).json({
        message: "You are not allowed to send messages here",
      });
    }

    let fileUrl = "";

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!text && !fileUrl && type !== "location") {
      return res.status(400).json({
        message: "Message cannot be empty",
      });
    }

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      type: type || "text",
      text: text || "",
      fileUrl,
      location: type === "location" ? { url: locationUrl } : undefined,
      readBy: [userId],
    });

    await Chat.findByIdAndUpdate(chatId, {
      updatedAt: new Date(),
    });

    const populatedMessage = await message.populate("sender", "email");

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({
      message: "Could not send message",
      error: error.message,
    });
  }
};

exports.getMyChats = async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId,
    })
      .populate("home", "title images location")
      .populate("participants", "email")
      .sort({ updatedAt: -1 });

    const chatsWithData = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await Message.findOne({
          chat: chat._id,
        })
          .populate("sender", "email")
          .populate("readBy", "_id")
          .sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.userId },
          readBy: { $ne: req.userId },
        });

        return {
          _id: chat._id,
          home: chat.home,
          participants: chat.participants,
          lastMessage,
          unreadCount,
          updatedAt: lastMessage?.createdAt || chat.updatedAt,
        };
      }),
    );

    chatsWithData.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json(chatsWithData);
  } catch (error) {
    res.status(500).json({
      message: "Could not load chats",
      error: error.message,
    });
  }
};

exports.markMessagesAsRead = async (req, res) => {
  try {
    const chatId = req.params.chatId;

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.userId },
        readBy: {
          $ne: req.userId,
        },
      },
      {
        $addToSet: {
          readBy: req.userId,
        },
      },
    );

    res.json({
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not mark messages as read",
      error: error.message,
    });
  }
};

exports.editMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.userId;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Message text cannot be empty" });
    }

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can edit only your messages" });
    }

    message.text = text.trim();
    message.edited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await message.populate("sender", "email");

    res.json(populatedMessage);
  } catch (error) {
    res.status(500).json({
      message: "Could not edit message",
      error: error.message,
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (message.sender.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can delete only your messages" });
    }

    await message.deleteOne();

    res.json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete message",
      error: error.message,
    });
  }
};
