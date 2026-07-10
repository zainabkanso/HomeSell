const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const chatController = require("../controllers/chatController");

router.post("/start/:homeId", authMiddleware, chatController.startChat);

router.get("/:chatId/messages", authMiddleware, chatController.getMessages);

router.post(
  "/:chatId/messages",
  authMiddleware,
  upload.single("file"),
  chatController.sendMessage,
);

router.get("/my-chats", authMiddleware, chatController.getMyChats);
router.delete(
  "/messages/:messageId",
  authMiddleware,
  chatController.deleteMessage,
);
router.put("/messages/:messageId", authMiddleware, chatController.editMessage);
router.put("/:chatId/read", authMiddleware, chatController.markMessagesAsRead);

module.exports = router;
