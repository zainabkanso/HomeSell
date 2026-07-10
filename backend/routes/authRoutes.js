const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  register,
  login,
  me,
  updateMe,
  createAdmin,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/admin", authMiddleware, createAdmin);
router.get("/me", authMiddleware, me);
router.put("/me", authMiddleware, updateMe);

module.exports = router;
