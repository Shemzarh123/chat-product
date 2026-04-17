require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later.'
});
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chatdb')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// Models
const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');
const Meeting = require('./models/Meeting');
const AvailabilitySlot = require('./models/AvailabilitySlot');
const Invite = require('./models/Invite');
const Notification = require('./models/Notification');
const paymentRoutes = require('./routes/payments');

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const userData = new User({
      ...req.body,
      role: req.body.role || 'client',
      businessDetails: req.body.businessDetails || {}
    });
    await userData.save();
    const token = jwt.sign({ id: userData._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ 
      success: true,
      token, 
      user: { 
        id: userData._id, 
        email: userData.email,
        subscriptionPlan: userData.subscriptionPlan,
        joiningFeePaid: userData.joiningFeePaid
      } 
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/chats', authMiddleware, async (req, res) => {
  const chats = await Chat.find({ participants: req.user.id }).populate('participants');
  res.json({ chats });
});

app.get('/api/messages/:chatId', authMiddleware, async (req, res) => {
  const messages = await Message.find({ conversation_id: req.params.chatId }).sort({ created_at: 1 });
  res.json({ messages });
});

app.post('/api/messages', authMiddleware, async (req, res) => {
  const message = new Message({ ...req.body, sender: req.user.id });
  await message.save();
  const populated = await Message.findById(message._id).populate('sender');
  res.json(populated);
});

// Legacy mock subscriptions (keep for fallback)
app.get('/api/subscription-plans', authMiddleware, (req, res) => {
  const plans = [
    {
      id: 'joining_fee',
      name: 'Joining Fee (One-time)',
      price: 99, // ZAR
      duration: 'one-time',
      description: 'R99 one-time setup fee to join platform',
      features: ['Platform Access', 'Profile Setup', 'Basic Support']
    },
    {
      id: 'starter',
      name: 'Starter Monthly',
      price: 199, // ZAR
      duration: 'monthly',
      description: 'Essential plan for small businesses',
      features: ['Unlimited Chats', 'Basic Analytics', 'Email Support']
    },
    {
      id: 'pro',
      name: 'Pro Monthly',
      price: 499, // ZAR
      duration: 'monthly',
      description: 'Advanced features for agencies',
      features: ['All Starter + Priority Support', 'Advanced Analytics', 'API Access', 'Custom Branding']
    }
  ];
  res.json({ success: true, plans });
});

// Remove mock /api/create-subscription - use /api/payments instead
// app.post('/api/create-subscription', authMiddleware, async (req, res) => {
  try {
    const { planId, duration = 'monthly', currency = 'ZAR' } = req.body;
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Mock payment processing (replace with PayFast/Stripe later)
    console.log(`Mock payment: User ${user.email} subscribed to ${planId} (${currency} ${duration})`);
    
    let planName, price;
    if (planId === 'joining_fee') {
      user.joiningFeePaid = true;
      planName = 'Joining Fee Paid';
      price = 99;
    } else {
      const plans = {
        starter: { name: 'Starter', price: 199 },
        pro: { name: 'Pro', price: 499 }
      };
      const plan = plans[planId];
      if (!plan) {
        return res.status(400).json({ success: false, error: 'Invalid plan' });
      }
      user.subscriptionPlan = planId;
      user.subscriptionStatus = 'active';
      user.currency = currency;
      user.subscriptionStart = new Date();
      user.subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      planName = plan.name;
      price = plan.price;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      subscription: {
        plan_id: planId,
        plan_name: planName,
        price,
        currency,
        status: user.subscriptionStatus
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount payments routes
app.use('/api/payments', paymentRoutes);

app.get('/api/user-subscription', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('subscriptionPlan joiningFeePaid subscriptionStatus currency subscriptionStart subscriptionEnd');
    res.json({ 
      success: true,
      subscription: user.subscriptionPlan !== 'free' ? {
        plan_id: user.subscriptionPlan,
        plan_name: user.subscriptionPlan === 'starter' ? 'Starter' : 'Pro',
        price: user.subscriptionPlan === 'starter' ? 199 : 499,
        currency: user.currency,
        status: user.subscriptionStatus,
        start_date: user.subscriptionStart,
        end_date: user.subscriptionEnd
      } : null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== NEW MEETING APIs =====
app.get('/api/meetings', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const query = { 
      $or: [{ host: req.user.id }, { participants: req.user.id }] 
    };
    if (status) query.status = status;
    const meetings = await Meeting.find(query)
      .populate('host', 'name email status')
      .populate('participants', 'name email')
      .sort({ startTime: -1 });
    res.json({ success: true, meetings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/meetings', authMiddleware, async (req, res) => {
  try {
    const meeting = new Meeting({ ...req.body, host: req.user.id });
    await meeting.save();
    const populated = await Meeting.findById(meeting._id)
      .populate('host', 'name email')
      .populate('participants', 'name email');
    res.json({ success: true, meeting: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.get('/api/availability/:userId', authMiddleware, async (req, res) => {
  try {
    const slots = await AvailabilitySlot.find({
      host: req.params.userId,
      isBooked: false
    }).sort({ startTime: 1 });
    res.json({ success: true, slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/availability', authMiddleware, async (req, res) => {
  try {
    const slots = req.body.map(slotData => new AvailabilitySlot({ ...slotData, host: req.user.id }));
    await AvailabilitySlot.insertMany(slots);
    res.json({ success: true, message: 'Availability slots created' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/invites', authMiddleware, async (req, res) => {
  try {
    const invite = new Invite({ ...req.body, inviter: req.user.id });
    await invite.save();
    const populated = await Invite.findById(invite._id)
      .populate('meeting', 'title startTime')
      .populate('invitee', 'name email')
      .populate('inviter', 'name');
    // Create notification
    await new Notification({
      user: invite.invitee,
      type: 'meeting_invite',
      title: `Meeting Invite: ${invite.meeting.title}`,
      message: `You've been invited to "${invite.meeting.title}" on ${invite.meeting.startTime}`,
      relatedId: invite._id,
      data: { inviteId: invite._id, meetingId: invite.meeting._id }
    }).save();
    res.json({ success: true, invite: populated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.put('/api/invites/:id/respond', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'accepted' or 'declined'
    const invite = await Invite.findById(req.params.id).populate('meeting');
    if (invite.invitee.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }
    invite.status = status;
    invite.respondedAt = new Date();
    await invite.save();
    
    if (status === 'accepted') {
      // Add to meeting participants
      invite.meeting.participants.push(req.user.id);
      await invite.meeting.save();
    }
    res.json({ success: true, invite });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/notifications', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ success: true, notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true }
    );
res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Profile endpoint
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Website chat endpoint for standalone
app.post('/api/website-chat', async (req, res) => {
  try {
    const { message, conversationId, senderName, senderEmail } = req.body;
    let chat = conversationId ? await Chat.findById(conversationId) : new Chat({ type: 'website' });
    if (!chat._id) await chat.save();
    const newMessage = new Message({ 
      content: message, 
      senderName, 
      senderEmail || 'guest', 
      conversation_id: chat._id,
      isGuest: true 
    });
    await newMessage.save();
    // Emit to socket if chat room
    io.to(`chat_${chat._id}`).emit('newMessage', newMessage);
    res.json({ success: true, message: newMessage, conversationId: chat._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Socket.io
io.use((socket, next) => {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      socket.user = decoded

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('userOnline', (userId) => {
    socket.broadcast.emit('userOnline', userId);
  });

  socket.on('sendMessage', async (message) => {
    socket.to(`chat_${message.conversation_id}`).emit('newMessage', message);
    io.emit('chatsUpdated', []);
    // Create notification
    await new Notification({
      user: message.recipient || null, // Logic to find other participants
      type: 'unread_message',
      title: `New message from ${message.senderName}`,
      message: message.content.substring(0, 50) + '...',
      relatedId: message.id,
      priority: 'normal'
    }).save();
  });

  socket.on('joinChat', (chatId) => {
    socket.join(`chat_${chatId}`);
  });

  // ===== NEW MEETING SOCKET EVENTS =====
  socket.on('meetingJoined', (meetingId) => {
    socket.to(`meeting_${meetingId}`).emit('participantJoined', { userId: socket.id });
  });

  socket.on('callStarted', (meetingId) => {
    io.to(`meeting_${meetingId}`).emit('callStarted', { hostId: socket.id });
  });

  socket.on('bookingConfirmed', (bookingData) => {
    io.to(`user_${bookingData.hostId}`).emit('bookingConfirmed', bookingData);
  });

  socket.on('joinMeeting', (meetingId) => {
    socket.join(`meeting_${meetingId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Recovery: Daily backup cron
cron.schedule('0 2 * * *', async () => {
  console.log('Running daily chat backup...');
  const fs = require('fs');
  const backup = await Message.find().lean();
  fs.writeFileSync('backups/messages-backup.json', JSON.stringify(backup, null, 2));
  console.log('Backup saved');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
