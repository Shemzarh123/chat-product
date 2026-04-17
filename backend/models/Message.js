const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  content: String,
  type: { type: String, default: 'text' },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  read: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  status: { type: String, default: 'sent', enum: ['sending', 'sent', 'delivered', 'read', 'failed'] },
  backup_id: String,
  created_at: { type: Date, default: Date.now }
});

messageSchema.index({ conversation_id: 1, created_at: -1 });

module.exports = mongoose.model('Message', messageSchema);
