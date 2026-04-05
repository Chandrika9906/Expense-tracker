const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const auth = require("../middleware/auth");
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const profileUploadDir = path.join(__dirname, "../uploads/profiles");
if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}

// Configure multer for profile image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, profileUploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files allowed"));
    }
  },
});

const parseUserAgent = (userAgent = "") => {
  const ua = String(userAgent);

  let browser = "Unknown Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { browser, os };
};

const getRequestCountry = (req) => {
  return (
    req.headers["x-vercel-ip-country"] ||
    req.headers["cf-ipcountry"] ||
    req.headers["x-country-code"] ||
    "Unknown"
  );
};

// Get user profile
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile
router.put("/", auth, async (req, res) => {
  try {
    const { name, email, currency, language, timezone } = req.body;

    // Validation
    if (!name || name.trim().length < 2) {
      return res
        .status(400)
        .json({ message: "Name must be at least 2 characters" });
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Valid email is required" });
    }

    // Check if email exists for another user
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user.id },
    });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), email, currency, language, timezone },
      { new: true },
    ).select("-password");

    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Change password
router.put("/password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }

    if (!newPassword || newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findById(req.user.id);

    // Check current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, { password: hashedPassword });

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Upload profile image
router.post("/upload-image", auth, (req, res) => {
  upload.single("profileImage")(req, res, async (err) => {
    try {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "Image must be less than 5MB" });
        }
        return res
          .status(400)
          .json({ message: err.message || "Invalid file upload" });
      }

      if (err) {
        return res
          .status(400)
          .json({ message: err.message || "Only image files allowed" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const imageUrl = `/uploads/profiles/${req.file.filename}`;

      await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });

      return res.json({
        message: "Profile image updated successfully",
        imageUrl,
      });
    } catch (error) {
      console.error("Profile image upload error:", error);
      return res.status(500).json({ message: "Error uploading image" });
    }
  });
});

// Toggle 2FA
router.put("/2fa", auth, async (req, res) => {
  try {
    const { enabled } = req.body;

    await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled: enabled });

    res.json({
      message: `Two-factor authentication ${enabled ? "enabled" : "disabled"}`,
      twoFactorEnabled: enabled,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get current session info
router.get("/sessions/current", auth, async (req, res) => {
  try {
    const userAgent = req.headers["user-agent"] || "";
    const { browser, os } = parseUserAgent(userAgent);
    const country = getRequestCountry(req);
    const forwardedFor = req.headers["x-forwarded-for"];
    const ipAddress = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : String(forwardedFor || req.ip || "").split(",")[0].trim();

    res.json({
      label: "Current Session",
      browser,
      os,
      country,
      ipAddress: ipAddress || "Unknown",
      userAgent,
      active: true,
      lastSeen: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch session info" });
  }
});

module.exports = router;
