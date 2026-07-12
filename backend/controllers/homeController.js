const Home = require("../models/Home");
const { deleteFileByUrl } = require("../utils/firebaseStorage");

const isLebanesePhone = (phone) => {
  if (!phone) return false;

  const cleaned = String(phone).replace(/[\s\-()]/g, "");

  return /^(?:\+961|00961|961)?(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$|^0(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$/.test(
    cleaned,
  );
};

const normalizeUploadedFiles = (files = []) => {
  return files.map((file) => file.path).filter(Boolean);
};

const userOwnsHome = (home, userId) => {
  if (!home?.owner || !userId) return false;

  return home.owner.toString() === userId.toString();
};

/* =========================================================
   GET ALL PUBLISHED HOMES
========================================================= */

exports.getHomes = async (req, res) => {
  try {
    const homes = await Home.find({
      $or: [
        { status: "published" },
        { status: { $exists: false } },
      ],
    }).sort({ createdAt: -1 });

    return res.json(homes);
  } catch (error) {
    console.error("GET HOMES ERROR:", error);

    return res.status(500).json({
      message: "Failed to load homes",
      error: error.message,
    });
  }
};

/* =========================================================
   GET ONE HOME
========================================================= */

exports.getHomeById = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    return res.json(home);
  } catch (error) {
    console.error("GET HOME ERROR:", error);

    return res.status(500).json({
      message: "Failed to load home",
      error: error.message,
    });
  }
};

/* =========================================================
   CREATE HOME
========================================================= */

exports.createHome = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      bedrooms,
      bathrooms,
      area,
      ownerPhone,
      status = "published",
    } = req.body;

    if (!title || !description || !price || !location) {
      return res.status(400).json({
        message:
          "Title, description, price, and location are required.",
      });
    }

    if (!ownerPhone) {
      return res.status(400).json({
        message: "Owner phone number is required",
      });
    }

    if (!isLebanesePhone(ownerPhone)) {
      return res.status(400).json({
        message:
          "Owner phone must be a valid Lebanese phone number.",
      });
    }

    if (!["draft", "published"].includes(status)) {
      return res.status(400).json({
        message: "Status must be 'draft' or 'published'",
      });
    }

    const images = normalizeUploadedFiles(
      req.files?.images || [],
    );

    const videos = normalizeUploadedFiles(
      req.files?.videos || [],
    );

    const requestedMainImageIndex = Number(
      req.body.mainImageIndex || 0,
    );

    const validMainImageIndex =
      Number.isInteger(requestedMainImageIndex) &&
      requestedMainImageIndex >= 0 &&
      requestedMainImageIndex < images.length
        ? requestedMainImageIndex
        : 0;

    const mainImage =
      images[validMainImageIndex] || images[0] || "";

    const home = new Home({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      location: location.trim(),
      bedrooms: Number(bedrooms || 0),
      bathrooms: Number(bathrooms || 0),
      area: Number(area || 0),

      images,
      mainImage,
      videos,

      ownerPhone: ownerPhone.trim(),
      owner: req.userId,
      status,
    });

    await home.save();

    return res.status(201).json(home);
  } catch (error) {
    console.error("CREATE HOME ERROR:", error);

    return res.status(500).json({
      message: "Failed to create home",
      error: error.message,
    });
  }
};

/* =========================================================
   UPDATE HOME
========================================================= */

exports.updateHome = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      bedrooms,
      bathrooms,
      area,
      ownerPhone,
      mainImageIndex,
      deleteImages,
      deleteVideos,
      selectedMainImage,
      status,
    } = req.body;

    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    const isOwner = userOwnsHome(home, req.userId);
    const isAdmin =
      req.isAdmin === true || req.isAdmin === "true";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to update this home",
      });
    }

    if (ownerPhone && !isLebanesePhone(ownerPhone)) {
      return res.status(400).json({
        message:
          "Owner phone must be a valid Lebanese phone number.",
      });
    }

    if (
      status &&
      !["draft", "published"].includes(status)
    ) {
      return res.status(400).json({
        message: "Status must be 'draft' or 'published'",
      });
    }

    if (deleteImages) {
      const imagesToDelete = Array.isArray(deleteImages)
        ? deleteImages
        : [deleteImages];

      await Promise.all(
        imagesToDelete.map((imageUrl) => deleteFileByUrl(imageUrl)),
      );

      home.images = (home.images || []).filter(
        (imageUrl) => !imagesToDelete.includes(imageUrl),
      );

      if (
        home.mainImage &&
        !home.images.includes(home.mainImage)
      ) {
        home.mainImage = home.images[0] || "";
      }
    }

    /*
      Remove selected video URLs from MongoDB.
    */

    if (deleteVideos) {
      const videosToDelete = Array.isArray(deleteVideos)
        ? deleteVideos
        : [deleteVideos];

      await Promise.all(
        videosToDelete.map((videoUrl) => deleteFileByUrl(videoUrl)),
      );

      home.videos = (home.videos || []).filter(
        (videoUrl) => !videosToDelete.includes(videoUrl),
      );
    }

    const newImages = normalizeUploadedFiles(
      req.files?.images || [],
    );

    if (newImages.length > 0) {
      home.images = [
        ...(home.images || []),
        ...newImages,
      ];

      const requestedIndex = Number(mainImageIndex || 0);

      const validIndex =
        Number.isInteger(requestedIndex) &&
        requestedIndex >= 0 &&
        requestedIndex < newImages.length
          ? requestedIndex
          : 0;

      home.mainImage =
        newImages[validIndex] ||
        home.mainImage ||
        newImages[0];
    }

    /*
      Use an existing image as main image only when
      the user did not upload new images.
    */

    if (
      selectedMainImage &&
      (home.images || []).includes(selectedMainImage) &&
      newImages.length === 0
    ) {
      home.mainImage = selectedMainImage;
    }

    if (!home.mainImage && home.images?.length > 0) {
      home.mainImage = home.images[0];
    }

    const newVideos = normalizeUploadedFiles(
      req.files?.videos || [],
    );

    if (newVideos.length > 0) {
      home.videos = [
        ...(home.videos || []),
        ...newVideos,
      ];
    }

    /*
      Update normal fields.

      We check undefined and empty strings so that numeric
      values such as 0 are handled correctly.
    */

    if (title !== undefined && title !== "") {
      home.title = title.trim();
    }

    if (
      description !== undefined &&
      description !== ""
    ) {
      home.description = description.trim();
    }

    if (price !== undefined && price !== "") {
      home.price = Number(price);
    }

    if (location !== undefined && location !== "") {
      home.location = location.trim();
    }

    if (
      bedrooms !== undefined &&
      bedrooms !== ""
    ) {
      home.bedrooms = Number(bedrooms);
    }

    if (
      bathrooms !== undefined &&
      bathrooms !== ""
    ) {
      home.bathrooms = Number(bathrooms);
    }

    if (area !== undefined && area !== "") {
      home.area = Number(area);
    }

    if (
      ownerPhone !== undefined &&
      ownerPhone !== ""
    ) {
      home.ownerPhone = ownerPhone.trim();
    }

    if (status) {
      home.status = status;
    }

    home.updatedAt = new Date();

    await home.save();

    return res.json(home);
  } catch (error) {
    console.error("UPDATE HOME ERROR:", error);

    return res.status(500).json({
      message: "Failed to update home",
      error: error.message,
    });
  }
};

/* =========================================================
   DELETE HOME
========================================================= */

exports.deleteHome = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    const isOwner = userOwnsHome(home, req.userId);
    const isAdmin =
      req.isAdmin === true || req.isAdmin === "true";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to delete this home",
      });
    }

    await home.deleteOne();

    return res.json({
      message: "Home deleted successfully",
    });
  } catch (error) {
    console.error("DELETE HOME ERROR:", error);

    return res.status(500).json({
      message: "Failed to delete home",
      error: error.message,
    });
  }
};

/* =========================================================
   GET CURRENT USER HOMES
========================================================= */

exports.getMyHomes = async (req, res) => {
  try {
    const homes = await Home.find({
      owner: req.userId,
    }).sort({
      createdAt: -1,
    });

    return res.json(homes);
  } catch (error) {
    console.error("GET MY HOMES ERROR:", error);

    return res.status(500).json({
      message: "Failed to load your homes",
      error: error.message,
    });
  }
};

/* =========================================================
   PUBLISH DRAFT
========================================================= */

exports.publishDraft = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    const isOwner = userOwnsHome(home, req.userId);
    const isAdmin =
      req.isAdmin === true || req.isAdmin === "true";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message:
          "You are not allowed to publish this home",
      });
    }

    home.status = "published";
    home.updatedAt = new Date();

    await home.save();

    return res.json({
      message: "Home published successfully",
      home,
    });
  } catch (error) {
    console.error("PUBLISH HOME ERROR:", error);

    return res.status(500).json({
      message: "Failed to publish home",
      error: error.message,
    });
  }
};