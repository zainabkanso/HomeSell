const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);

    const prefix = file.mimetype.startsWith("video/")
      ? "video"
      : "image";

    cb(null, `${prefix}-${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
 const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",

  "video/mp4",
  "video/webm",
  "video/ogg",

  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG, WEBP images and MP4, WEBM, OGG videos are allowed"
      )
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
  fileFilter,
});

module.exports = upload;