const User = require("../models/User");
const Home = require("../models/Home");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!req.isAdmin) {
      return res.status(403).json({
        message: "Admin only",
      });
    }

    if (userId === req.userId) {
      return res.status(400).json({
        message: "You cannot delete your own account",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const userHomes = await Home.find({ owner: userId }).select("_id");
    const homeIds = userHomes.map((home) => home._id);

    const chats = await Chat.find({
      $or: [
        { participants: userId },
        { home: { $in: homeIds } },
      ],
    }).select("_id");

    const chatIds = chats.map((chat) => chat._id);

    await Message.deleteMany({
      $or: [
        { sender: userId },
        { chat: { $in: chatIds } },
      ],
    });

    await Chat.deleteMany({
      _id: { $in: chatIds },
    });

    await Home.deleteMany({
      owner: userId,
    });

    await User.updateMany(
      {},
      {
        $pull: {
          favorites: { $in: homeIds },
        },
      },
    );

    await User.findByIdAndDelete(userId);

    res.json({
      message: "User and related data deleted successfully",
    });
  } catch (error) {
    console.log("DELETE USER ERROR:", error);

    res.status(500).json({
      message: "Could not delete user",
      error: error.message,
    });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user.favorites);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load favorites", error: error.message });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const homeId = req.params.homeId;
    const home = await Home.findById(homeId);
    if (!home) {
      return res.status(404).json({ message: "Home not found" });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.favorites.includes(homeId)) {
      return res.status(400).json({ message: "Home already in favorites" });
    }

    user.favorites.push(homeId);
    await user.save();
    res.json({ message: "Added to favorites" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add favorite", error: error.message });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const homeId = req.params.homeId;
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.favorites = user.favorites.filter((id) => id.toString() !== homeId);
    await user.save();
    res.json({ message: "Removed from favorites" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to remove favorite", error: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const users = await User.find(
      {},
      "name email phone isAdmin favorites",
    ).populate({
      path: "favorites",
      select: "title location price",
    });
    res.json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to load users", error: error.message });
  }
};

exports.setUserAdmin = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const { userId } = req.params;
    const { isAdmin } = req.body;

    if (req.userId === userId && isAdmin === false) {
      return res
        .status(400)
        .json({ message: "You cannot revoke your own admin access" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isAdmin = Boolean(isAdmin);
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not update user role", error: error.message });
  }
};

// exports.deleteUser = async (req, res) => {
//   if (!req.isAdmin) {
//     return res.status(403).json({ message: "Admin access required" });
//   }

//   try {
//     const { userId } = req.params;

//     if (req.userId === userId) {
//       return res
//         .status(400)
//         .json({ message: "You cannot delete your own account" });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     await user.remove();
//     res.json({ message: "User removed successfully" });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ message: "Could not delete user", error: error.message });
//   }
// };
