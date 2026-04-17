const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  duration: { type: Number, required: true }, // minutes
  timezone: { type: String, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  meetingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Meeting' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AvailabilitySlot', availabilitySchema);

