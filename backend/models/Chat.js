const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lead_name: String,
  last_message: String,
  last_message_time: { type: Date, default: Date.now },
  unread_count: { type: Map, of: Number, default: {} },
  status_story: String,
  backup_version: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Chat', chatSchema);
