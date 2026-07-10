const Feedback = require("../models/Feedback");

exports.createFeedback = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        message: "Name and feedback message are required",
      });
    }

    const feedback = await Feedback.create({
      name,
      email,
      message,
    });

    res.status(201).json({
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not submit feedback",
      error: error.message,
    });
  }
};

exports.getShownFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ isShown: true }).sort({
      createdAt: -1,
    });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({
      message: "Could not load feedbacks",
      error: error.message,
    });
  }
};

exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });

    res.json(feedbacks);
  } catch (error) {
    res.status(500).json({
      message: "Could not load feedbacks",
      error: error.message,
    });
  }
};

exports.toggleFeedbackShown = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    feedback.isShown = !feedback.isShown;
    await feedback.save();

    res.json(feedback);
  } catch (error) {
    res.status(500).json({
      message: "Could not update feedback",
      error: error.message,
    });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        message: "Feedback not found",
      });
    }

    await feedback.deleteOne();

    res.json({
      message: "Feedback deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete feedback",
      error: error.message,
    });
  }
};
