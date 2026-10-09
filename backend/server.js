const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ======================================================
// EMAIL CONFIGURATION - FORGOT PASSWORD
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ======================================================
// MODELS
// ======================================================

const User = require("./models/User");
const Admin = require("./models/Admin");
const Post = require("./models/Post");
const Event = require("./models/Event");
const Community = require("./models/Community");
const Notification = require("./models/Notification");

const app = express();

// ======================================================
// CONFIGURATION
// ======================================================

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const ADMIN_SETUP_SECRET = process.env.ADMIN_SETUP_SECRET;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing in .env");
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET is missing in .env");
  process.exit(1);
}

// ======================================================
// CORS
// ======================================================

app.use(
  cors({
    origin: [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://hometown-hub-digital-community.vercel.app",
],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================================
// UPLOADS FOLDER
// ======================================================

const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use("/uploads", express.static(uploadsDir));

// ======================================================
// MULTER CONFIGURATION
// ======================================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },

  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();

    const filename =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1000000000) +
      ext;

    cb(null, filename);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      error.code = "INVALID_IMAGE_TYPE";

      cb(error);
    }
  },
});

// ======================================================
// DATABASE CONNECTION
// ======================================================

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected successfully");
  })
  .catch((error) => {
    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );
  });

// ======================================================
// HELPER FUNCTIONS
// ======================================================

const escapeRegex = (text = "") => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const createUserToken = (user) => {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: "user",
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const createAdminToken = (admin) => {
  return jwt.sign(
    {
      adminId: admin._id.toString(),
      role: "admin",
    },
    JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const safeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  mobile: user.mobile || "",
  address: user.address || "",
  profilePhoto: user.profilePhoto || "",
  isBlocked: user.isBlocked || false,
  createdAt: user.createdAt,
});

const safeAdmin = (admin) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  createdAt: admin.createdAt,
});

// ======================================================
// USER AUTHENTICATION MIDDLEWARE
// ======================================================

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid user token",
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by admin.",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// ======================================================
// ADMIN AUTHENTICATION MIDDLEWARE
// ======================================================

const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      decoded.role !== "admin" ||
      !decoded.adminId
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const admin = await Admin.findById(decoded.adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin not found",
      });
    }

    req.admin = admin;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired admin token",
    });
  }
};

// ======================================================
// HOME / HEALTH
// ======================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Hometown Hub Backend is running 🚀",
    version: "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  const states = [
    "disconnected",
    "connected",
    "connecting",
    "disconnecting",
  ];

  res.json({
    success: true,
    database:
      states[mongoose.connection.readyState] || "unknown",
  });
});

// ======================================================
// USER APIs
// ======================================================

// REGISTER

app.post("/api/users", async (req, res) => {
  try {
    let { name, email, password } = req.body;

    name = name?.trim();
    email = email?.trim().toLowerCase();

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (name.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must contain at least 2 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      success: true,
      message: "Registration successful",
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
});

// LOGIN

app.post("/api/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    email = email?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by admin.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = createUserToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: safeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
});

// GET USERS

app.get(
  "/api/users",
  authenticateUser,
  async (req, res) => {
    try {
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error("Get users error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
      });
    }
  }
);
// ======================================================
// FORGOT PASSWORD - SEND OTP
// ======================================================

app.post("/api/users/forgot-password", async (req, res) => {
  try {
    let { email } = req.body;

    email = email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked by admin.",
      });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // OTP valid for 10 minutes
    user.resetOTP = otp;
    user.resetOTPExpiry = new Date(
      Date.now() + 10 * 60 * 1000
    );

    await user.save();

    // Send OTP email
    await transporter.sendMail({
      from: `"Hometown Hub" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Hometown Hub - Password Reset OTP",

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          padding: 30px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #ffffff;
        ">

          <h2 style="color: #2563eb;">
            Hometown Hub
          </h2>

          <p>Hello <strong>${user.name}</strong>,</p>

          <p>
            We received a request to reset your Hometown Hub password.
          </p>

          <p>Your password reset OTP is:</p>

          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 10px;
            margin: 20px 0;
          ">
            ${otp}
          </div>

          <p>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <p>
            If you did not request a password reset, please ignore this email.
          </p>

          <hr />

          <p style="font-size: 12px; color: #6b7280;">
            This is an automated email from Hometown Hub.
          </p>

        </div>
      `,
    });

    console.log(
      `🔐 Password reset OTP sent to ${user.email}`
    );

    res.json({
      success: true,
      message: "OTP sent successfully to your email",
    });

  } catch (error) {
    console.error(
      "Forgot password error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});


// ======================================================
// VERIFY FORGOT PASSWORD OTP
// ======================================================

app.post("/api/users/verify-reset-otp", async (req, res) => {
  try {
    let { email, otp } = req.body;

    email = email?.trim().toLowerCase();
    otp = otp?.trim();

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    if (new Date() > user.resetOTPExpiry) {
      user.resetOTP = null;
      user.resetOTPExpiry = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.error(
      "Verify OTP error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
});


// ======================================================
// RESET PASSWORD USING OTP
// ======================================================

app.post("/api/users/reset-password", async (req, res) => {
  try {
    let {
      email,
      otp,
      newPassword,
      confirmPassword,
    } = req.body;

    email = email?.trim().toLowerCase();
    otp = otp?.trim();

    if (
      !email ||
      !otp ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password and confirm password do not match",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.resetOTP || !user.resetOTPExpiry) {
      return res.status(400).json({
        success: false,
        message:
          "OTP verification required",
      });
    }

    if (new Date() > user.resetOTPExpiry) {
      user.resetOTP = null;
      user.resetOTPExpiry = null;

      await user.save();

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please request a new OTP.",
      });
    }

    if (user.resetOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Prevent using the same password
    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message:
          "New password must be different from your old password",
      });
    }

    // Hash new password
    user.password = await bcrypt.hash(
      newPassword,
      12
    );

    // Clear OTP after successful reset
    user.resetOTP = null;
    user.resetOTPExpiry = null;

    await user.save();

    res.json({
      success: true,
      message:
        "Password reset successfully. You can now login.",
    });

  } catch (error) {
    console.error(
      "Reset password error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to reset password",
    });
  }
});

// CURRENT USER

app.get(
  "/api/users/me",
  authenticateUser,
  async (req, res) => {
    res.json({
      success: true,
      user: safeUser(req.user),
    });
  }
);
// CHANGE PASSWORD
app.put("/api/users/change-password", authenticateUser, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const passwordMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
});

// UPDATE PROFILE

app.put(
  "/api/users/:id",
  authenticateUser,
  async (req, res) => {
    try {
      if (
        req.params.id !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "You can update only your own profile",
        });
      }

      const {
        name,
        mobile,
        address,
      } = req.body;

      const updateData = {};

      if (name !== undefined) {
        const cleanName = name.trim();

        if (cleanName.length < 2) {
          return res.status(400).json({
            success: false,
            message: "Name must contain at least 2 characters",
          });
        }

        updateData.name = cleanName;
      }

      if (mobile !== undefined) {
        updateData.mobile = mobile.trim();
      }

      if (address !== undefined) {
        updateData.address = address.trim();
      }

      const updatedUser =
        await User.findByIdAndUpdate(
          req.user._id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: safeUser(updatedUser),
      });
    } catch (error) {
      console.error("Update profile error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }
  }
);

// PROFILE PHOTO

app.post(
  "/api/users/:id/profile-photo",
  authenticateUser,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      if (
        req.params.id !== req.user._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can update only your own profile photo",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Profile photo is required",
        });
      }

      const oldPhoto = req.user.profilePhoto;

      const profilePhoto =
        `/uploads/${req.file.filename}`;

      const updatedUser =
        await User.findByIdAndUpdate(
          req.user._id,
          { profilePhoto },
          {
            new: true,
          }
        );

      if (
        oldPhoto &&
        oldPhoto.startsWith("/uploads/")
      ) {
        const oldFile = path.join(
          __dirname,
          oldPhoto.replace("/uploads/", "uploads/")
        );

        if (fs.existsSync(oldFile)) {
          fs.unlink(oldFile, () => {});
        }
      }

      res.json({
        success: true,
        message: "Profile photo updated successfully",
        user: safeUser(updatedUser),
      });
    } catch (error) {
      console.error("Profile photo error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to upload profile photo",
      });
    }
  }
);

// ======================================================
// POST APIs
// ======================================================

// CREATE POST

app.post(
  "/api/posts",
  authenticateUser,
  async (req, res) => {
    try {
      const content = req.body.content?.trim();

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Post content is required",
        });
      }

      const post = await Post.create({
        content,
        userName: req.user.name,
      });

      res.status(201).json({
        success: true,
        message: "Post created successfully",
        post,
      });
    } catch (error) {
      console.error("Create post error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create post",
      });
    }
  }
);

// GET POSTS

app.get("/api/posts", async (req, res) => {
  try {
    const posts = await Post.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error("Get posts error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
    });
  }
});

// UPDATE POST

app.put(
  "/api/posts/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const content = req.body.content?.trim();

      if (!content) {
        return res.status(400).json({
          success: false,
          message: "Post content is required",
        });
      }

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (post.userName !== req.user.name) {
        return res.status(403).json({
          success: false,
          message: "You can edit only your own post",
        });
      }

      post.content = content;

      await post.save();

      res.json({
        success: true,
        message: "Post updated successfully",
        post,
      });
    } catch (error) {
      console.error("Update post error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update post",
      });
    }
  }
);

// DELETE POST

app.delete(
  "/api/posts/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (post.userName !== req.user.name) {
        return res.status(403).json({
          success: false,
          message: "You can delete only your own post",
        });
      }

      await Post.findByIdAndDelete(req.params.id);

      res.json({
        success: true,
        message: "Post deleted successfully",
      });
    } catch (error) {
      console.error("Delete post error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete post",
      });
    }
  }
);

// LIKE / UNLIKE

app.post(
  "/api/posts/:id/like",
  authenticateUser,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (!Array.isArray(post.likedBy)) {
        post.likedBy = [];
      }

      const userId = req.user._id.toString();

      const alreadyLiked =
        post.likedBy.some(
          (id) => id.toString() === userId
        );

      if (alreadyLiked) {
        post.likedBy =
          post.likedBy.filter(
            (id) => id.toString() !== userId
          );
      } else {
        post.likedBy.push(req.user._id);
      }

      await post.save();

      res.json({
        success: true,
        liked: !alreadyLiked,
        likes: post.likedBy.length,
      });
    } catch (error) {
      console.error("Like error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to like post",
      });
    }
  }
);

// COMMENT

app.post(
  "/api/posts/:id/comment",
  authenticateUser,
  async (req, res) => {
    try {
      const text = req.body.text?.trim();

      if (!text) {
        return res.status(400).json({
          success: false,
          message: "Comment cannot be empty",
        });
      }

      const post = await Post.findById(req.params.id);

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      if (!Array.isArray(post.comments)) {
        post.comments = [];
      }

      post.comments.push({
        text,
        userName: req.user.name,
      });

      await post.save();

      res.json({
        success: true,
        message: "Comment added successfully",
        post,
      });
    } catch (error) {
      console.error("Comment error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to add comment",
      });
    }
  }
);

// DELETE COMMENT

app.delete(
  "/api/posts/:postId/comment/:commentId",
  authenticateUser,
  async (req, res) => {
    try {
      const post = await Post.findById(
        req.params.postId
      );

      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const comment = post.comments.id(
        req.params.commentId
      );

      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      if (
        comment.userName !== req.user.name
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can delete only your own comment",
        });
      }

      comment.deleteOne();

      await post.save();

      res.json({
        success: true,
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Delete comment error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete comment",
      });
    }
  }
);

// ======================================================
// EVENT APIs
// ======================================================

// CREATE EVENT

app.post(
  "/api/events",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        title,
        description,
        date,
        location,
      } = req.body;

      if (
        !title ||
        !description ||
        !date ||
        !location
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Title, description, date and location are required",
        });
      }

      const eventDate = new Date(date);

      if (Number.isNaN(eventDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid event date",
        });
      }

      const event = await Event.create({
        title: title.trim(),
        description: description.trim(),
        date: eventDate,
        location: location.trim(),
        userName: req.user.name,
      });

      // ==================================================
      // CREATE EVENT NOTIFICATION
      // ==================================================

      const notification =
        await Notification.create({
          userName: req.user.name,
          message:
            `Your event "${event.title}" was created successfully.`,
          eventId: event._id,
          isRead: false,
        });

      console.log(
        "🔔 NOTIFICATION CREATED:",
        {
          id: notification._id,
          userName: notification.userName,
          message: notification.message,
        }
      );

      res.status(201).json({
        success: true,
        message: "Event created successfully",
        event,
        notification,
      });
    } catch (error) {
      console.error("Create event error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to create event",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : undefined,
      });
    }
  }
);

// GET EVENTS

app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find().sort({
      date: 1,
    });

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error("Get events error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
    });
  }
});

// SEARCH EVENTS

app.get(
  "/api/events/search",
  async (req, res) => {
    try {
      const search =
        req.query.search?.trim() || "";

      if (!search) {
        const events = await Event.find().sort({
          date: 1,
        });

        return res.json({
          success: true,
          events,
        });
      }

      const regex = new RegExp(
        escapeRegex(search),
        "i"
      );

      const events = await Event.find({
        $or: [
          { title: regex },
          { description: regex },
          { location: regex },
        ],
      }).sort({
        date: 1,
      });

      res.json({
        success: true,
        events,
      });
    } catch (error) {
      console.error("Search events error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to search events",
      });
    }
  }
);

// DATE-WISE EVENTS

app.get(
  "/api/events/date-wise",
  async (req, res) => {
    try {
      const now = new Date();

      const upcomingEvents =
        await Event.find({
          date: { $gte: now },
        }).sort({
          date: 1,
        });

      const pastEvents =
        await Event.find({
          date: { $lt: now },
        }).sort({
          date: -1,
        });

      res.json({
        success: true,
        upcomingEvents,
        pastEvents,
      });
    } catch (error) {
      console.error(
        "Date-wise events error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch date-wise events",
      });
    }
  }
);

// UPDATE EVENT

app.put(
  "/api/events/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const event = await Event.findById(
        req.params.id
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (
        event.userName !== req.user.name
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can edit only your own event",
        });
      }

      const {
        title,
        description,
        date,
        location,
      } = req.body;

      if (title !== undefined) {
        event.title = title.trim();
      }

      if (description !== undefined) {
        event.description =
          description.trim();
      }

      if (location !== undefined) {
        event.location =
          location.trim();
      }

      if (date !== undefined) {
        const eventDate = new Date(date);

        if (
          Number.isNaN(
            eventDate.getTime()
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid event date",
          });
        }

        event.date = eventDate;
      }

      await event.save();

      res.json({
        success: true,
        message: "Event updated successfully",
        event,
      });
    } catch (error) {
      console.error("Update event error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to update event",
      });
    }
  }
);

// DELETE EVENT

app.delete(
  "/api/events/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const event = await Event.findById(
        req.params.id
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (
        event.userName !== req.user.name
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can delete only your own event",
        });
      }

      await Event.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message: "Event deleted successfully",
      });
    } catch (error) {
      console.error("Delete event error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to delete event",
      });
    }
  }
);

// JOIN / LEAVE EVENT

app.post(
  "/api/events/:id/join",
  authenticateUser,
  async (req, res) => {
    try {
      const event = await Event.findById(
        req.params.id
      );

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      if (!Array.isArray(event.joinedUsers)) {
        event.joinedUsers = [];
      }

      const userName = req.user.name;

      const alreadyJoined =
        event.joinedUsers.includes(
          userName
        );

      if (alreadyJoined) {
        event.joinedUsers =
          event.joinedUsers.filter(
            (name) => name !== userName
          );
      } else {
        event.joinedUsers.push(userName);
      }

      await event.save();

      // ==================================================
      // JOIN / LEAVE NOTIFICATION
      // ==================================================

      const notification =
        await Notification.create({
          userName,
          message: alreadyJoined
            ? `You left the event "${event.title}".`
            : `You joined the event "${event.title}".`,
          eventId: event._id,
          isRead: false,
        });

      console.log(
        "🔔 EVENT JOIN/LEAVE NOTIFICATION:",
        notification.message
      );

      res.json({
        success: true,
        joined: !alreadyJoined,
        event,
        notification,
      });
    } catch (error) {
      console.error(
        "Join event error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Failed to join event",
      });
    }
  }
);

// ======================================================
// COMMUNITY APIs
// ======================================================

// CREATE COMMUNITY

app.post(
  "/api/communities",
  authenticateUser,
  async (req, res) => {
    try {
      const {
        name,
        description,
        location,
      } = req.body;

      if (!name || !description) {
        return res.status(400).json({
          success: false,
          message:
            "Name and description are required",
        });
      }

      const cleanName = name.trim();

      const existingCommunity =
        await Community.findOne({
          name: {
            $regex:
              `^${escapeRegex(cleanName)}$`,
            $options: "i",
          },
        });

      if (existingCommunity) {
        return res.status(409).json({
          success: false,
          message: "Community already exists",
        });
      }

      const community =
        await Community.create({
          name: cleanName,
          description: description.trim(),
          location:
            location?.trim() || "",
          createdBy: req.user.name,
          members: [req.user.name],
        });

      const notification =
        await Notification.create({
          userName: req.user.name,
          message:
            `Community "${community.name}" created successfully.`,
          isRead: false,
        });

      console.log(
        "🔔 COMMUNITY NOTIFICATION:",
        notification.message
      );

      res.status(201).json({
        success: true,
        message:
          "Community created successfully",
        community,
        notification,
      });
    } catch (error) {
      console.error(
        "Create community error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create community",
      });
    }
  }
);

// GET COMMUNITIES

app.get(
  "/api/communities",
  async (req, res) => {
    try {
      const communities =
        await Community.find().sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        communities,
      });
    } catch (error) {
      console.error(
        "Get communities error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch communities",
      });
    }
  }
);

// SEARCH COMMUNITIES

app.get(
  "/api/communities/search",
  async (req, res) => {
    try {
      const search =
        req.query.search?.trim() || "";

      if (!search) {
        const communities =
          await Community.find().sort({
            createdAt: -1,
          });

        return res.json({
          success: true,
          communities,
        });
      }

      const regex = new RegExp(
        escapeRegex(search),
        "i"
      );

      const communities =
        await Community.find({
          $or: [
            { name: regex },
            { description: regex },
            { location: regex },
          ],
        }).sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        communities,
      });
    } catch (error) {
      console.error(
        "Search communities error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to search communities",
      });
    }
  }
);

// JOIN / LEAVE COMMUNITY

app.post(
  "/api/communities/:id/join",
  authenticateUser,
  async (req, res) => {
    try {
      const community =
        await Community.findById(
          req.params.id
        );

      if (!community) {
        return res.status(404).json({
          success: false,
          message: "Community not found",
        });
      }

      if (!Array.isArray(community.members)) {
        community.members = [];
      }

      const userName = req.user.name;

      const alreadyMember =
        community.members.includes(
          userName
        );

      if (alreadyMember) {
        community.members =
          community.members.filter(
            (name) => name !== userName
          );
      } else {
        community.members.push(userName);
      }

      await community.save();

      const notification =
        await Notification.create({
          userName,
          message: alreadyMember
            ? `You left "${community.name}".`
            : `You joined "${community.name}".`,
          isRead: false,
        });

      console.log(
        "🔔 COMMUNITY JOIN/LEAVE NOTIFICATION:",
        notification.message
      );

      res.json({
        success: true,
        joined: !alreadyMember,
        community,
        notification,
      });
    } catch (error) {
      console.error(
        "Join community error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to join community",
      });
    }
  }
);

// UPDATE COMMUNITY

app.put(
  "/api/communities/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const community =
        await Community.findById(
          req.params.id
        );

      if (!community) {
        return res.status(404).json({
          success: false,
          message:
            "Community not found",
        });
      }

      if (
        community.createdBy !==
        req.user.name
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the community creator can edit it",
        });
      }

      const {
        name,
        description,
        location,
      } = req.body;

      if (name !== undefined) {
        community.name =
          name.trim();
      }

      if (description !== undefined) {
        community.description =
          description.trim();
      }

      if (location !== undefined) {
        community.location =
          location.trim();
      }

      await community.save();

      res.json({
        success: true,
        message:
          "Community updated successfully",
        community,
      });
    } catch (error) {
      console.error(
        "Update community error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update community",
      });
    }
  }
);

// DELETE COMMUNITY

app.delete(
  "/api/communities/:id",
  authenticateUser,
  async (req, res) => {
    try {
      const community =
        await Community.findById(
          req.params.id
        );

      if (!community) {
        return res.status(404).json({
          success: false,
          message:
            "Community not found",
        });
      }

      if (
        community.createdBy !==
        req.user.name
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only the community creator can delete it",
        });
      }

      await Community.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Community deleted successfully",
      });
    } catch (error) {
      console.error(
        "Delete community error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete community",
      });
    }
  }
);

// ======================================================
// NOTIFICATION APIs
// ======================================================

// GET NOTIFICATIONS

app.get(
  "/api/notifications/:userName",
  authenticateUser,
  async (req, res) => {
    try {
      // IMPORTANT:
      // Always use authenticated user's name.
      // URL userName is not trusted.

      const notifications =
        await Notification.find({
          userName: req.user.name,
        }).sort({
          createdAt: -1,
        });

      console.log(
        "🔔 NOTIFICATIONS FETCHED FOR:",
        req.user.name
      );

      console.log(
        "🔔 NOTIFICATION COUNT:",
        notifications.length
      );

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error(
        "Get notifications error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch notifications",
      });
    }
  }
);

// ALSO GET NOTIFICATIONS WITHOUT USERNAME

app.get(
  "/api/notifications",
  authenticateUser,
  async (req, res) => {
    try {
      const notifications =
        await Notification.find({
          userName: req.user.name,
        }).sort({
          createdAt: -1,
        });

      console.log(
        "🔔 ALL NOTIFICATIONS FETCHED FOR:",
        req.user.name
      );

      console.log(
        "🔔 NOTIFICATION COUNT:",
        notifications.length
      );

      res.status(200).json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error(
        "Get notifications error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch notifications",
      });
    }
  }
);

// MARK NOTIFICATION AS READ

app.put(
  "/api/notifications/:id/read",
  authenticateUser,
  async (req, res) => {
    try {
      const notification =
        await Notification.findById(
          req.params.id
        );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message:
            "Notification not found",
        });
      }

      if (
        notification.userName !==
        req.user.name
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You can update only your notifications",
        });
      }

      notification.isRead = true;

      await notification.save();

      console.log(
        "🔔 NOTIFICATION MARKED AS READ:",
        notification._id
      );

      res.status(200).json({
        success: true,
        message:
          "Notification marked as read",
        notification,
      });
    } catch (error) {
      console.error(
        "Read notification error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update notification",
      });
    }
  }
);

// ======================================================
// ADMIN APIs
// ======================================================

// ADMIN LOGIN

app.post(
  "/api/admin/login",
  async (req, res) => {
    try {
      let { email, password } = req.body;

      email = email
        ?.trim()
        .toLowerCase();

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message:
            "Email and password are required",
        });
      }

      const admin =
        await Admin.findOne({
          email,
        });

      if (!admin) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid admin email or password",
        });
      }

      let passwordMatch = false;

      if (
        typeof admin.password === "string" &&
        admin.password.startsWith("$2")
      ) {
        passwordMatch =
          await bcrypt.compare(
            password,
            admin.password
          );
      } else {
        passwordMatch =
          password === admin.password;

        if (passwordMatch) {
          admin.password =
            await bcrypt.hash(
              password,
              12
            );

          await admin.save();
        }
      }

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid admin email or password",
        });
      }

      const token =
        createAdminToken(admin);

      res.json({
        success: true,
        message:
          "Admin login successful",
        token,
        admin: safeAdmin(admin),
      });
    } catch (error) {
      console.error(
        "Admin login error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Admin login failed",
      });
    }
  }
);

// CREATE ADMIN

app.post(
  "/api/admin/create",
  async (req, res) => {
    try {
      const adminCount =
        await Admin.countDocuments();

      const setupSecret =
        req.headers[
          "x-admin-setup-secret"
        ];

      if (
        adminCount > 0 &&
        setupSecret !==
          ADMIN_SETUP_SECRET
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Admin creation is protected. Valid setup secret required.",
        });
      }

      let {
        name,
        email,
        password,
      } = req.body;

      name = name?.trim();

      email = email
        ?.trim()
        .toLowerCase();

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required",
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Admin password must contain at least 6 characters",
        });
      }

      const existingAdmin =
        await Admin.findOne({
          email,
        });

      if (existingAdmin) {
        return res.status(409).json({
          success: false,
          message:
            "Admin email already exists",
        });
      }

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      const admin =
        await Admin.create({
          name,
          email,
          password:
            hashedPassword,
        });

      res.status(201).json({
        success: true,
        message:
          "Admin created successfully",
        admin: safeAdmin(admin),
      });
    } catch (error) {
      console.error(
        "Create admin error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to create admin",
      });
    }
  }
);

// ADMIN ME

app.get(
  "/api/admin/me",
  authenticateAdmin,
  async (req, res) => {
    res.json({
      success: true,
      admin: safeAdmin(
        req.admin
      ),
    });
  }
);

// ADMIN STATS

app.get(
  "/api/admin/stats",
  authenticateAdmin,
  async (req, res) => {
    try {
      const [
        totalUsers,
        totalCommunities,
        totalEvents,
        totalPosts,
      ] = await Promise.all([
        User.countDocuments(),
        Community.countDocuments(),
        Event.countDocuments(),
        Post.countDocuments(),
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalCommunities,
          totalEvents,
          totalPosts,
        },
      });
    } catch (error) {
      console.error(
        "Admin stats error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch admin statistics",
      });
    }
  }
);

// ADMIN USERS

app.get(
  "/api/admin/users",
  authenticateAdmin,
  async (req, res) => {
    try {
      const users =
        await User.find()
          .select("-password")
          .sort({
            createdAt: -1,
          });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      console.error(
        "Admin get users error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch users",
      });
    }
  }
);

// ADMIN SINGLE USER

app.get(
  "/api/admin/users/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "Admin get user error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch user",
      });
    }
  }
);

// BLOCK / UNBLOCK USER

app.put(
  "/api/admin/users/:id/block",
  authenticateAdmin,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      user.isBlocked =
        !user.isBlocked;

      await user.save();

      res.json({
        success: true,
        message: user.isBlocked
          ? "User blocked successfully"
          : "User unblocked successfully",
        user: safeUser(user),
      });
    } catch (error) {
      console.error(
        "Block user error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to update user status",
      });
    }
  }
);

// DELETE USER

app.delete(
  "/api/admin/users/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "User not found",
        });
      }

      await User.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "User deleted successfully",
      });
    } catch (error) {
      console.error(
        "Admin delete user error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete user",
      });
    }
  }
);

// ADMIN COMMUNITIES

app.get(
  "/api/admin/communities",
  authenticateAdmin,
  async (req, res) => {
    try {
      const communities =
        await Community.find().sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        communities,
      });
    } catch (error) {
      console.error(
        "Admin communities error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch communities",
      });
    }
  }
);

// ADMIN DELETE COMMUNITY

app.delete(
  "/api/admin/communities/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const community =
        await Community.findById(
          req.params.id
        );

      if (!community) {
        return res.status(404).json({
          success: false,
          message:
            "Community not found",
        });
      }

      await Community.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Community deleted successfully",
      });
    } catch (error) {
      console.error(
        "Admin delete community error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete community",
      });
    }
  }
);

// ADMIN EVENTS

app.get(
  "/api/admin/events",
  authenticateAdmin,
  async (req, res) => {
    try {
      const events =
        await Event.find().sort({
          date: 1,
        });

      res.json({
        success: true,
        events,
      });
    } catch (error) {
      console.error(
        "Admin events error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch events",
      });
    }
  }
);

// ADMIN DELETE EVENT

app.delete(
  "/api/admin/events/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const event =
        await Event.findById(
          req.params.id
        );

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found",
        });
      }

      await Event.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Event deleted successfully",
      });
    } catch (error) {
      console.error(
        "Admin delete event error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete event",
      });
    }
  }
);

// ADMIN POSTS

app.get(
  "/api/admin/posts",
  authenticateAdmin,
  async (req, res) => {
    try {
      const posts =
        await Post.find().sort({
          createdAt: -1,
        });

      res.json({
        success: true,
        posts,
      });
    } catch (error) {
      console.error(
        "Admin posts error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to fetch posts",
      });
    }
  }
);

// ADMIN DELETE POST

app.delete(
  "/api/admin/posts/:id",
  authenticateAdmin,
  async (req, res) => {
    try {
      const post =
        await Post.findById(
          req.params.id
        );

      if (!post) {
        return res.status(404).json({
          success: false,
          message:
            "Post not found",
        });
      }

      await Post.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true,
        message:
          "Post deleted successfully",
      });
    } catch (error) {
      console.error(
        "Admin delete post error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Failed to delete post",
      });
    }
  }
);

// ======================================================
// 404 HANDLER
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Global error:",
      error
    );

    if (
      error.code ===
      "INVALID_IMAGE_TYPE"
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Image size must be less than 5MB.",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
);

// ======================================================
// START SERVER
// ======================================================

app.listen(PORT, () => {
  console.log("");

  console.log(
    "===================================="
  );

  console.log(
    "🚀 Hometown Hub Backend Started"
  );

  console.log(
    `📡 Server: http://localhost:${PORT}`
  );

  console.log(
    `❤️ Health: http://localhost:${PORT}/api/health`
  );

  console.log(
    "🔔 Notifications API: /api/notifications"
  );

  console.log(
    "===================================="
  );

  console.log("");
});