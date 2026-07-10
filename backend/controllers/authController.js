const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (userId, isAdmin = false) => {
  return jwt.sign({ userId, isAdmin }, process.env.JWT_SECRET || "secret123", {
    expiresIn: "7d",
  });
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please fill out all fields",
      });
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();

    const isAdmin = adminEmail ? email.toLowerCase() === adminEmail : false;

    const newUser = new User({
      name: name ? name.trim() : "",
      email: email.toLowerCase(),
      phone: phone ? phone.trim() : "",
      password: hashedPassword,
      isAdmin,
    });

    await newUser.save();

    const token = createToken(newUser._id, newUser.isAdmin);

    res.status(201).json({
      user: {
        id: newUser._id,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials",
      });
    }

    const token = createToken(user._id, user.isAdmin);

    res.json({
      user: {
        id: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

// CURRENT USER
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select(
      "name phone email isAdmin",
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      id: user._id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not load user",
      error: error.message,
    });
  }
};

// CREATE ADMIN USER (admin only)
exports.createAdmin = async (req, res) => {
  if (!req.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone ? phone.trim() : "",
      password: hashedPassword,
      isAdmin: true,
    });

    await newAdmin.save();

    res.status(201).json({
      id: newAdmin._id,
      email: newAdmin.email,
      isAdmin: newAdmin.isAdmin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not create admin",
      error: error.message,
    });
  }
};

// UPDATE USER PROFILE
exports.updateMe = async (req, res) => {
  try {
    const { name, phone, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (name) {
      user.name = name.trim();
    }

    if (phone) {
      user.phone = phone.trim();
    }

    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({
        email: email.toLowerCase(),
      });

      if (existingUser) {
        return res.status(400).json({
          message: "Email is already in use",
        });
      }

      user.email = email.toLowerCase();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          message: "Current password is required to change password",
        });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not update profile",
      error: error.message,
    });
  }
};
