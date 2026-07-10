const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const feedbackController = require("../controllers/feedbackController");

router.post("/", feedbackController.createFeedback);

router.get("/shown", feedbackController.getShownFeedbacks);

router.get("/admin", authMiddleware, feedbackController.getAllFeedbacks);

router.put(
  "/admin/:id/toggle",
  authMiddleware,
  feedbackController.toggleFeedbackShown,
);

router.delete("/admin/:id", authMiddleware, feedbackController.deleteFeedback);

module.exports = router;
