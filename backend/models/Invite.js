const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema({
  meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting', required: true },
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inviter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  email: String, // For external invites
  meetingLink: String,
  sentAt: { type: Date, default: Date.now },
  respondedAt: Date
});

module.exports = mongoose.model('Invite', inviteSchema);

