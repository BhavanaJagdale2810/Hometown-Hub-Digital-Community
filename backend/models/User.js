const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },

    mobile: {
      type: String,
      default: "",
      trim: true,
      maxlength: [15, "Mobile number cannot exceed 15 characters"],
    },

    address: {
      type: String,
      default: "",
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },

    profilePhoto: {
      type: String,
      default: "",
      trim: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("User", userSchema);