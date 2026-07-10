const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getFavorites,
  addFavorite,
  removeFavorite,
  getAllUsers,
  setUserAdmin,
  deleteUser,
} = require("../controllers/userController");

router.get("/", authMiddleware, getAllUsers);
router.patch("/:userId/admin", authMiddleware, setUserAdmin);
router.delete("/:id", authMiddleware, deleteUser);
router.get("/favorites", authMiddleware, getFavorites);
router.post("/favorites/:homeId", authMiddleware, addFavorite);
router.delete("/favorites/:homeId", authMiddleware, removeFavorite);

module.exports = router;
