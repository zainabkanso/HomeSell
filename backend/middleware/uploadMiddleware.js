const multer = require("multer");
const { uploadBuffer } = require("../utils/firebaseStorage");

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

class FirebaseStorageEngine {
  _handleFile(req, file, cb) {
    const chunks = [];

    file.stream.on("data", (chunk) => chunks.push(chunk));
    file.stream.on("error", (err) => cb(err));

    file.stream.on("end", async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const { url, path: storagePath } = await uploadBuffer(
          buffer,
          file.mimetype,
          file.originalname,
        );

        cb(null, {
          path: url,
          storagePath,
          size: buffer.length,
          mimetype: file.mimetype,
          originalname: file.originalname,
        });
      } catch (error) {
        cb(error);
      }
    });
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

const upload = multer({
  storage: new FirebaseStorageEngine(),
  fileFilter,

  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 15,
  },
});

module.exports = upload;
