const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    default: null,
  },

  isRead: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);