const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
  getHomes,
  getHomeById,
  createHome,
  updateHome,
  deleteHome,
  getMyHomes,
  publishDraft,
} = require("../controllers/homeController");

router.get("/", getHomes);

router.get(
  "/my",
  authMiddleware,
  getMyHomes,
);

router.get("/:id", getHomeById);

router.post(
  "/",
  authMiddleware,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  createHome,
);

router.put(
  "/:id",
  authMiddleware,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 5 },
  ]),
  updateHome,
);

router.post(
  "/:id/publish",
  authMiddleware,
  publishDraft,
);

router.delete(
  "/:id",
  authMiddleware,
  deleteHome,
);

module.exports = router;