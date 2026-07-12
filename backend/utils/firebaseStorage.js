const path = require("path");
const { getBucket } = require("../config/firebase");

const getFolderForMime = (mimetype) => {
  if (mimetype.startsWith("image/")) {
    return "homesell/images";
  }

  if (mimetype.startsWith("video/")) {
    return "homesell/videos";
  }

  if (mimetype.startsWith("audio/")) {
    return "homesell/audio";
  }

  return "homesell/files";
};

const buildDestination = (mimetype, originalname = "") => {
  const folder = getFolderForMime(mimetype);
  const ext = path.extname(originalname);
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  return `${folder}/${filename}`;
};

const uploadBuffer = async (buffer, mimetype, originalname) => {
  const bucket = getBucket();
  const destination = buildDestination(mimetype, originalname);
  const file = bucket.file(destination);

  await file.save(buffer, {
    metadata: {
      contentType: mimetype,
      cacheControl: "public, max-age=31536000",
    },
  });

  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

  return {
    url: publicUrl,
    path: destination,
  };
};

const extractStoragePathFromUrl = (fileUrl) => {
  if (!fileUrl) {
    return null;
  }

  const googleStorageMatch = fileUrl.match(
    /storage\.googleapis\.com\/[^/]+\/(.+)$/,
  );

  if (googleStorageMatch) {
    return decodeURIComponent(googleStorageMatch[1]);
  }

  const firebaseMatch = fileUrl.match(/\/o\/([^?]+)/);

  if (firebaseMatch) {
    return decodeURIComponent(firebaseMatch[1]);
  }

  return null;
};

const deleteFileByUrl = async (fileUrl) => {
  const storagePath = extractStoragePathFromUrl(fileUrl);

  if (!storagePath) {
    return;
  }

  try {
    const bucket = getBucket();
    await bucket.file(storagePath).delete({ ignoreNotFound: true });
  } catch (error) {
    console.error("Firebase delete error:", error.message);
  }
};

module.exports = {
  uploadBuffer,
  deleteFileByUrl,
  extractStoragePathFromUrl,
};
