const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  meetingLink: String, // WebRTC room ID or external link
  status: { type: String, enum: ['scheduled', 'active', 'ended', 'cancelled'], default: 'scheduled' },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }, // Associated chat
  timezone: String,
  description: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

meetingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Meeting', meetingSchema);
