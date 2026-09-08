const mongoose = require("mongoose");

// ======================
// Comment Schema
// ======================
const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },

  userName: {
    type: String,
    default: "Unknown User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ======================
// Post Schema
// ======================
const postSchema = new mongoose.Schema({
  // Post content
  content: {
    type: String,
    required: true,
  },

  // User who created the post
  userName: {
    type: String,
    default: "Unknown User",
  },

  // Users who liked this post
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  // Comments
  comments: [commentSchema],

  // Post creation date
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);