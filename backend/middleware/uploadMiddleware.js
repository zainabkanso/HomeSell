const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

const allowedTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",

  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",

  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  return cb(
    new Error(
      "Only JPG, JPEG, PNG, WEBP images, MP4, WEBM, OGG, MOV videos, and supported audio files are allowed.",
    ),
    false,
  );
};

const storage = new CloudinaryStorage({
  cloudinary,

  params: async (req, file) => {
    let folder = "homesell/files";

    if (file.mimetype.startsWith("image/")) {
      folder = "homesell/images";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "homesell/videos";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "homesell/audio";
    }

    return {
      folder,
      resource_type: "auto",
      public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    };
  },
});

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 15,
  },
});

module.exports = upload;