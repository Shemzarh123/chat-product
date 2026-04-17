const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['message', 'meeting_invite', 'meeting_reminder', 'call_started', 'payment', 'system'],
    required: true 
  },
  title: String,
  message: String,
  priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  relatedId: mongoose.Schema.Types.ObjectId, // meetingId, messageId, etc.
  read: { type: Boolean, default: false },
  data: mongoose.Schema.Types.Mixed, // Extra payload
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);

