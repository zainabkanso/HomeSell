const Home = require("../models/Home");

const isLebanesePhone = (phone) => {
  if (!phone) return false;

  const cleaned = phone.replace(/[\s\-()]/g, "");

  return /^(?:\+961|00961|961)?(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$|^0(?:3\d{6}|(?:70|71|76|78|79|81)\d{6})$/.test(cleaned);
};

exports.getHomes = async (req, res) => {
  try {
    // Fetch published homes (treat missing status as published for backward compatibility)
    const homes = await Home.find({
      $or: [{ status: "published" }, { status: { $exists: false } }],
    }).sort({ createdAt: -1 });

    res.json(homes);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load homes",
      error: error.message,
    });
  }
};

exports.getHomeById = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    res.json(home);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load home",
      error: error.message,
    });
  }
};

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

    if (!ownerPhone) {
      return res.status(400).json({
        message: "Owner phone number is required",
      });
    }

    if (!isLebanesePhone(ownerPhone)) {
      return res.status(400).json({
        message: "Owner phone must be a valid Lebanese phone number.",
      });
    }

    if (status !== "draft" && status !== "published") {
      return res.status(400).json({
        message: "Status must be 'draft' or 'published'",
      });
    }

    const images = req.files?.images
      ? req.files.images.map((file) => `/uploads/${file.filename}`)
      : [];

    const videos = req.files?.videos
      ? req.files.videos.map((file) => `/uploads/${file.filename}`)
      : [];

    const mainImageIndex = Number(req.body.mainImageIndex || 0);
    const mainImage = images[mainImageIndex] || images[0] || "";

    const home = new Home({
      title,
      description,
      price,
      location,
      bedrooms,
      bathrooms,
      area,
      images,
      mainImage,
      videos,
      ownerPhone,
      owner: req.userId,
      status,
    });

    await home.save();

    res.status(201).json(home);
  } catch (error) {
    console.log("CREATE HOME ERROR:", error);

    res.status(500).json({
      message: "Failed to create home",
      error: error.message,
    });
  }
};

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
    } = req.body;

    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    if (home.owner.toString() !== req.userId && !req.isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to update this home",
      });
    }

    if (ownerPhone && !isLebanesePhone(ownerPhone)) {
      return res.status(400).json({
        message: "Owner phone must be a valid Lebanese phone number.",
      });
    }

    // Delete selected images
    if (deleteImages) {
      const imagesToDelete = Array.isArray(deleteImages)
        ? deleteImages
        : [deleteImages];

      home.images = (home.images || []).filter(
        (img) => !imagesToDelete.includes(img),
      );

      if (!home.images.includes(home.mainImage)) {
        home.mainImage = home.images[0] || "";
      }
    }

    // Delete selected videos
    if (deleteVideos) {
      const videosToDelete = Array.isArray(deleteVideos)
        ? deleteVideos
        : [deleteVideos];

      home.videos = (home.videos || []).filter(
        (video) => !videosToDelete.includes(video),
      );
    }

    // Add new images
    if (req.files?.images && req.files.images.length > 0) {
      const newImages = req.files.images.map(
        (file) => `/uploads/${file.filename}`,
      );

      home.images = [...(home.images || []), ...newImages];

      const index = Number(mainImageIndex || 0);

      // Give priority to newly uploaded main image
      if (newImages[index]) {
        home.mainImage = newImages[index];
      } else if (!home.mainImage) {
        home.mainImage = newImages[0];
      }
    }

    // Choose existing image as main image ONLY if no new images were uploaded
    if (
      selectedMainImage &&
      (home.images || []).includes(selectedMainImage) &&
      !(req.files?.images && req.files.images.length > 0)
    ) {
      home.mainImage = selectedMainImage;
    }
    // If still no main image
    if (!home.mainImage && home.images?.length > 0) {
      home.mainImage = home.images[0];
    }

    // Add new videos
    if (req.files?.videos && req.files.videos.length > 0) {
      const newVideos = req.files.videos.map(
        (file) => `/uploads/${file.filename}`,
      );

      home.videos = [...(home.videos || []), ...newVideos];
    }

    home.title = title || home.title;
    home.description = description || home.description;
    home.price = price || home.price;
    home.location = location || home.location;
    home.bedrooms = bedrooms || home.bedrooms;
    home.bathrooms = bathrooms || home.bathrooms;
    home.area = area || home.area;
    home.ownerPhone = ownerPhone || home.ownerPhone;

    // Update status if provided in body
    if (req.body.status) {
      if (req.body.status !== "draft" && req.body.status !== "published") {
        return res.status(400).json({
          message: "Status must be 'draft' or 'published'",
        });
      }
      home.status = req.body.status;
    }

    home.updatedAt = new Date();

    await home.save();

    res.json(home);
  } catch (error) {
    console.log("CREATE HOME ERROR FULL:", error);
  console.log("CREATE HOME ERROR MESSAGE:", error.message);
    res.status(500).json({
      message: "Failed to update home",
      error: error.message,
    });
  }
};

exports.deleteHome = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    const isOwner = home.owner.toString() === req.userId.toString();
    const isAdmin = req.isAdmin === true || req.isAdmin === "true";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to delete this home",
      });
    }

    await home.deleteOne();

    res.json({
      message: "Home deleted successfully",
    });
  } catch (error) {
    console.log("DELETE HOME ERROR:", error);
  console.log("DELETE HOME ERROR MESSAGE:", error.message);
    res.status(500).json({
      message: "Failed to delete home",
      error: error.message,
    });
  }
};
// exports.deleteHome = async (req, res) => {
//   try {
//     const home = await Home.findById(req.params.id);

//     if (!home) {
//       return res.status(404).json({
//         message: "Home not found",
//       });
//     }

//     if (home.owner.toString() !== req.userId && !req.isAdmin) {
//       return res.status(403).json({
//         message: "You are not allowed to delete this home",
//       });
//     }

//     await home.deleteOne();

//     res.json({
//       message: "Home deleted successfully",
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to delete home",
//       error: error.message,
//     });
//   }
// };

exports.getMyHomes = async (req, res) => {
  try {
    const homes = await Home.find({ owner: req.userId }).sort({
      createdAt: -1,
    });
    res.json(homes);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load your homes",
      error: error.message,
    });
  }
};

exports.publishDraft = async (req, res) => {
  try {
    const home = await Home.findById(req.params.id);

    if (!home) {
      return res.status(404).json({
        message: "Home not found",
      });
    }

    if (home.owner.toString() !== req.userId && !req.isAdmin) {
      return res.status(403).json({
        message: "You are not allowed to publish this home",
      });
    }

    home.status = "published";
    home.updatedAt = new Date();
    await home.save();

    res.json({
      message: "Home published successfully",
      home,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to publish home",
      error: error.message,
    });
  }
};
