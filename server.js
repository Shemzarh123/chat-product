const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend/build'));

// Chat APIs
app.get('/api/chats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const chats = await pool.query(`
      SELECT c.*, 
             l.name as lead_name, l.phone_number, l.avatar,
             COUNT(m.id) FILTER (WHERE m.read = false AND m.sender != 'business') as unread_count,
             MAX(m.created_at) as last_message_time,
             MAX(m.content) as last_message
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.user_id = $1
      GROUP BY c.id, l.id, l.name, l.phone_number, l.avatar
      ORDER BY last_message_time DESC NULLS LAST
    `, [userId]);

    res.json({ success: true, chats: chats.rows });
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

app.get('/api/messages/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.user;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user owns conversation
    const conv = await pool.query('SELECT * FROM conversations WHERE id = $1 AND user_id = $2', [conversationId, userId]);
    if (conv.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await pool.query(`
      SELECT * FROM messages 
      WHERE conversation_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [conversationId, limit, offset]);

    // Mark as read for business
    await pool.query(`
      UPDATE messages 
      SET read = true 
      WHERE conversation_id = $1 AND sender != 'business' AND read = false
    `, [conversationId]);

    res.json({ 
      success: true, 
      messages: messages.rows.reverse(), // Newest last for UI
      hasMore: messages.rows.length === parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/messages', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, content, type = 'text' } = req.body;
    const { userId } = req.user;

    // Verify conversation
    const conv = await pool.query('SELECT * FROM conversations WHERE id = $1 AND user_id = $2', [conversation_id, userId]);
    if (conv.rows.length === 0) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const result = await pool.query(`
      INSERT INTO messages (conversation_id, sender, content, type, status)
      VALUES ($1, 'business', $2, $3, 'sent')
      RETURNING *
    `, [conversation_id, content, type]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});


// Auth imports
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'recoverflow_secret_key_change_in_prod';

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// Helper function to get current time info
const getTimeInfo = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  
  let greeting;
  if (hour < 12) greeting = 'Good morning';
  else if (hour < 17) greeting = 'Good afternoon';
  else greeting = 'Good evening';
  
  const isBusinessHours = day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  const isWeekend = day === 0 || day === 6;
  
  return {
    greeting,
    hour,
    day,
    isBusinessHours,
    isWeekend,
    formattedTime: now.toISOString(),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

// Helper for smart responses
const generateSmartResponse = (formData) => {
  const { service, budget, urgency } = formData;
  
  // Urgency-based response
  if (urgency === 'urgent') {
    return {
      response: "Your request is urgent! Our team prioritizes emergency cases and will contact you within 15 minutes. In the meantime, please call our emergency line if you need immediate assistance.",
      priority: 'high',
      estimatedResponse: '15 minutes'
    };
  }
  
  // Budget-based response
  if (budget && parseInt(budget) < 500) {
    return {
      response: "Thank you for your interest! We have excellent basic service options starting at affordable rates. Would you like us to send you more information about budget-friendly packages?",
      priority: 'normal',
      estimatedResponse: '30 minutes'
    };
  }
  
  // Service-based response
  const serviceResponses = {
    'dental_implants': "Great choice! Dental implants are our specialty. We offer free consultations and flexible payment plans. Would you like to schedule an appointment?",
    'teeth_whitening': "We offer professional teeth whitening with immediate results! Our treatment is safe and effective. Would you like to book a consultation?",
    'cosmetic_dentistry': "We have a range of cosmetic options to transform your smile. From veneers to bonding, we can help. Would you like to see our before/after examples?",
    'general_checkup': "Regular checkups are essential for oral health! We offer comprehensive examinations and cleaning. Would you like to schedule your appointment?",
    'emergency': "We understand dental emergencies can be stressful. Our team is ready to help you right away. Please call us immediately or visit our emergency page.",
    'consultation': "A free consultation is a great way to explore your options! We'll discuss your goals and create a personalized treatment plan. When would you like to come in?"
  };
  
  const baseResponse = serviceResponses[service] || "Thank you for your interest! We'd be happy to help you. Would you like to book a consultation?";
  
  return {
    response: baseResponse,
    priority: urgency === 'urgent' ? 'high' : 'normal',
    estimatedResponse: isBusinessHours() ? '30 minutes' : 'first thing tomorrow'
  };
};

const isBusinessHours = () => {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
};

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/recoverflow',
});

let twilio;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilio = require('twilio')(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  // Create a mock Twilio client for development/testing
  twilio = {
    messages: {
      create: async () => {
        console.log('Mock SMS sent');
        return Promise.resolve();
      }
    }
  };
  console.warn('Twilio environment variables not configured - using mock implementation');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// AI Assistant Configuration
const AI_ASSISTANT_CONFIG = {
  responseDelay: 1000, // Simulated AI response delay
  faqs: {
    'price': "Our prices start from $99. Would you like to see our product catalog?",
    'cost': "Our prices are competitive and depend on the service you need. Would you like to see our pricing plans?",
    'hours': "We're open Monday-Friday 9AM-5PM. Would you like to book an appointment?",
    'contact': "You can reach us at +1234567890 or email info@business.com",
    'services': "We offer a variety of services. Please check our product catalog for details.",
    'appointment': "You can book an appointment directly from our profile. Would you like to schedule one?",
    'payment': "We accept all major credit cards. Would you like to make a payment?",
    'invoice': "We can send you an invoice. What email address should we use?",
    'product': "We have a range of products available. Would you like to see our catalog?",
    'delivery': "Delivery times vary by location. Would you like to check available shipping options?"
  },
  productRecommendations: [
    "Based on your interests, I recommend our Premium Package. It includes all essential features and 24/7 support.",
    "You might be interested in our most popular service - the Starter Plan. It's perfect for small businesses.",
    "We have a special offer this month! Our Professional Package is 20% off for new customers.",
    "For your specific needs, I recommend our Custom Solution. We can tailor it to your requirements."
  ],
  defaultResponses: [
    "Thank you for your message! Our AI assistant is here to help. How can we assist you today?",
    "I understand you have a question. Let me help you find the information you need.",
    "That's a great question! Would you like to know more about our products or services?",
    "Our team is here to help. Could you please provide more details about your inquiry?"
  ]
};

// AI Assistant endpoint
app.post('/api/ai-assistant', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    const { userId } = req.user;

    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, AI_ASSISTANT_CONFIG.responseDelay));

    const lowercaseMessage = message.toLowerCase();
    let response = null;
    let actions = [];

    // Check for product-related keywords
    if (lowercaseMessage.includes('product') || lowercaseMessage.includes('service') || lowercaseMessage.includes('catalog')) {
      const products = await pool.query('SELECT * FROM products WHERE user_id = $1 AND featured = true', [userId]);
      if (products.rows.length > 0) {
        const featuredProduct = products.rows[0];
        response = `We have a great product called "${featuredProduct.name}" that might interest you. It's available for $${featuredProduct.price}. Would you like to learn more?`;
        actions.push({
          type: 'product',
          productId: featuredProduct.id,
          name: featuredProduct.name,
          price: featuredProduct.price
        });
      } else {
        response = "We offer a variety of high-quality products and services. Would you like to see our full catalog?";
        actions.push({ type: 'view_catalog' });
      }
    }

    // Check for payment-related keywords
    if (!response && (lowercaseMessage.includes('payment') || lowercaseMessage.includes('pay') || lowercaseMessage.includes('invoice'))) {
      response = "I can help you with payments! Would you like to make a payment now or request an invoice?";
      actions.push({ type: 'payment_request' });
    }

    // Check for appointment-related keywords
    if (!response && (lowercaseMessage.includes('appointment') || lowercaseMessage.includes('book') || lowercaseMessage.includes('schedule'))) {
      response = "You can book an appointment directly from our profile. Would you like to schedule one for this week?";
      actions.push({ type: 'book_appointment' });
    }

    // Find matching FAQ if no specific response found
    if (!response) {
      Object.keys(AI_ASSISTANT_CONFIG.faqs).forEach(keyword => {
        if (lowercaseMessage.includes(keyword) && !response) {
          response = AI_ASSISTANT_CONFIG.faqs[keyword];
          if (keyword.includes('product') || keyword.includes('service')) {
            actions.push({ type: 'view_catalog' });
          } else if (keyword.includes('appointment')) {
            actions.push({ type: 'book_appointment' });
          } else if (keyword.includes('payment') || keyword.includes('invoice')) {
            actions.push({ type: 'payment_request' });
          }
        }
      });
    }

    // Fallback to random default response
    if (!response) {
      response = AI_ASSISTANT_CONFIG.defaultResponses[
        Math.floor(Math.random() * AI_ASSISTANT_CONFIG.defaultResponses.length)
      ];
    }

    res.json({ 
      success: true, 
      response, 
      timestamp: new Date().toISOString(),
      isAI: true,
      actions: actions
    });

  } catch (error) {
    console.error('Error in AI assistant:', error);
    res.status(500).json({ error: 'AI assistant unavailable' });
  }
});

// Get customer records with detailed purchase history and interactions
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const customers = await pool.query(`
      SELECT l.*, 
             COALESCE(SUM(p.amount), 0) as total_spent,
             COUNT(DISTINCT p.id) as total_purchases,
             MAX(p.created_at) as last_purchase_date,
             COUNT(DISTINCT c.id) as total_conversations,
             MAX(m.created_at) as last_interaction_date
      FROM leads l
      LEFT JOIN payments p ON l.id = p.lead_id AND p.status = 'completed'
      LEFT JOIN conversations c ON l.id = c.lead_id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE l.user_id = $1
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `, [userId]);

    res.json({ 
      success: true, 
      customers: customers.rows.map(customer => ({
        ...customer,
        tags: customer.tags || [],
        total_spent: parseFloat(customer.total_spent),
        total_purchases: parseInt(customer.total_purchases),
        total_conversations: parseInt(customer.total_conversations),
        last_interaction_date: customer.last_interaction_date,
        days_since_last_interaction: customer.last_interaction_date 
          ? Math.floor((new Date() - new Date(customer.last_interaction_date)) / (1000 * 60 * 60 * 24))
          : null
      }))
    });

  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get detailed purchase history for a specific customer
app.get('/api/customers/:customerId/purchases', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { userId } = req.user;

    const purchases = await pool.query(`
      SELECT p.*, l.name as customer_name
      FROM payments p
      JOIN leads l ON p.lead_id = l.id
      WHERE l.id = $1 AND l.user_id = $2
      ORDER BY p.created_at DESC
    `, [customerId, userId]);

    res.json({ 
      success: true, 
      purchases: purchases.rows 
    });

  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get customer conversation history
app.get('/api/customers/:customerId/conversations', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { userId } = req.user;

    const conversations = await pool.query(`
      SELECT c.*, COUNT(m.id) as message_count, MAX(m.created_at) as last_message_date
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE l.id = $1 AND l.user_id = $2
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `, [customerId, userId]);

    res.json({ 
      success: true, 
      conversations: conversations.rows 
    });

  } catch (error) {
    console.error('Error fetching customer conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update customer record with tags and notes
app.put('/api/customers/:customerId', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { tags, notes, status } = req.body;
    const { userId } = req.user;

    const result = await pool.query(`
      UPDATE leads 
      SET tags = $1, notes = $2, status = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
      RETURNING *
    `, [tags, notes, status, customerId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      success: true, 
      customer: result.rows[0] 
    });

  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notifications for user
app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 50, offset = 0 } = req.query;

    const notifications = await pool.query(`
      SELECT * FROM notifications 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2 OFFSET $3
    `, [userId, parseInt(limit), parseInt(offset)]);

    res.json({ 
      success: true, 
      notifications: notifications.rows 
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', authenticateToken, async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId } = req.user;

    const result = await pool.query(`
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [notificationId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ 
      success: true, 
      notification: result.rows[0] 
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    await pool.query(`
      UPDATE notifications 
      SET read = true, updated_at = NOW()
      WHERE user_id = $1 AND read = false
    `, [userId]);

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification
const createNotification = async (userId, type, title, message, priority = 'normal', data = {}) => {
  try {
    const result = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, priority, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, type, title, message, priority, data]);

    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// Smart notification triggers
const checkForUnreadMessages = async () => {
  try {
    const conversations = await pool.query(`
      SELECT c.user_id, l.name as lead_name, COUNT(m.id) as unread_count
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      JOIN messages m ON c.id = m.conversation_id
      WHERE m.read = false AND m.sender != 'business'
      GROUP BY c.user_id, l.name
    `);

    for (const conv of conversations.rows) {
      if (conv.unread_count > 0) {
        await createNotification(
          conv.user_id,
          'unread_message',
          `New Message from ${conv.lead_name}`,
          `You have ${conv.unread_count} unread message${conv.unread_count > 1 ? 's' : ''}`,
          'high',
          { leadName: conv.lead_name, unreadCount: conv.unread_count }
        );
      }
    }
  } catch (error) {
    console.error('Error checking for unread messages:', error);
  }
};

const checkForPendingPayments = async () => {
  try {
    const pendingPayments = await pool.query(`
      SELECT user_id, COUNT(id) as pending_count, SUM(amount) as total_amount
      FROM payments
      WHERE status = 'pending'
      GROUP BY user_id
    `);

    for (const payment of pendingPayments.rows) {
      if (payment.pending_count > 0) {
        await createNotification(
          payment.user_id,
          'pending_payment',
          'Pending Payments',
          `You have ${payment.pending_count} pending payment${payment.pending_count > 1 ? 's' : ''} totaling $${payment.total_amount.toFixed(2)}`,
          'high',
          { pendingCount: payment.pending_count, totalAmount: payment.total_amount }
        );
      }
    }
  } catch (error) {
    console.error('Error checking for pending payments:', error);
  }
};

const checkForUpcomingAppointments = async () => {
  try {
    const upcomingAppointments = await pool.query(`
      SELECT user_id, l.name as lead_name, appointment_date
      FROM appointments a
      JOIN leads l ON a.lead_id = l.id
      WHERE status = 'scheduled' AND appointment_date > NOW() AND appointment_date < NOW() + INTERVAL '24 HOURS'
    `);

    for (const appointment of upcomingAppointments.rows) {
      const date = new Date(appointment.appointment_date);
      const timeString = date.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      await createNotification(
        appointment.user_id,
        'upcoming_appointment',
        'Upcoming Appointment',
        `You have an appointment with ${appointment.lead_name} tomorrow at ${timeString}`,
        'medium',
        { leadName: appointment.lead_name, appointmentDate: appointment.appointment_date }
      );
    }
  } catch (error) {
    console.error('Error checking for upcoming appointments:', error);
  }
};

// Schedule smart notifications
setInterval(checkForUnreadMessages, 300000); // Every 5 minutes
setInterval(checkForPendingPayments, 600000); // Every 10 minutes
setInterval(checkForUpcomingAppointments, 3600000); // Every hour

// Get exchange rates for currency conversion
app.get('/api/exchange-rates', async (req, res) => {
  try {
    // In a real application, you would fetch this from an API like OpenExchangeRates or Fixer.io
    // For demonstration purposes, we'll use fixed exchange rates
    const exchangeRates = {
      ZAR: 18.00,  // South African Rand
      USD: 1.00,   // US Dollar (base currency)
      EUR: 0.92,   // Euro
      GBP: 0.79,   // British Pound
      AUD: 1.52,   // Australian Dollar
      CAD: 1.35    // Canadian Dollar
    };

    res.json({ 
      success: true, 
      rates: exchangeRates 
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription plans
app.get('/api/subscription-plans', async (req, res) => {
  try {
    const plans = await pool.query(`
      SELECT * FROM subscription_plans 
      ORDER BY price ASC
    `);

    res.json({ 
      success: true, 
      plans: plans.rows.map(plan => ({
        ...plan,
        features: plan.features || []
      }))
    });

  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's current subscription
app.get('/api/user-subscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const subscription = await pool.query(`
      SELECT us.*, sp.name as plan_name, sp.description, sp.price, sp.duration, sp.features, 
             sp.max_products, sp.max_leads, sp.ai_features, sp.analytics, sp.support_level
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `, [userId]);

    res.json({ 
      success: true, 
      subscription: subscription.rows.length > 0 ? {
        ...subscription.rows[0],
        features: subscription.rows[0].features || []
      } : null
    });

  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create subscription
app.post('/api/create-subscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { planId, duration = 'monthly', currency = 'ZAR' } = req.body;

    // Get plan details
    const plan = await pool.query(`
      SELECT * FROM subscription_plans WHERE id = $1
    `, [planId]);

    if (plan.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    const selectedPlan = plan.rows[0];

    // Calculate end date
    const endDate = new Date();
    if (duration === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (duration === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription
    const result = await pool.query(`
      INSERT INTO user_subscriptions (user_id, plan_id, status, start_date, end_date, currency)
      VALUES ($1, $2, 'active', NOW(), $3, $4)
      RETURNING *
    `, [userId, planId, endDate, currency]);

    res.json({ 
      success: true, 
      subscription: {
        ...result.rows[0],
        plan_name: selectedPlan.name,
        features: selectedPlan.features || []
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
app.put('/api/cancel-subscription', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;

    const result = await pool.query(`
      UPDATE user_subscriptions 
      SET status = 'canceled'
      WHERE user_id = $1 AND status = 'active'
      RETURNING *
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate transaction fee
const calculateTransactionFee = (amount, planType = 'free') => {
  let feePercentage;
  
  switch (planType) {
    case 'free':
      feePercentage = 3.5; // 3.5% fee for free plan
      break;
    case 'pro':
      feePercentage = 2.5; // 2.5% fee for pro plan
      break;
    case 'enterprise':
      feePercentage = 1.5; // 1.5% fee for enterprise plan
      break;
    default:
      feePercentage = 3.5;
  }

  const feeAmount = (amount * feePercentage) / 100;
  return {
    feeAmount: parseFloat(feeAmount.toFixed(2)),
    feePercentage: parseFloat(feePercentage.toFixed(2))
  };
};

// Create transaction fee
const createTransactionFee = async (userId, paymentId, amount, feePercentage) => {
  try {
    const result = await pool.query(`
      INSERT INTO transaction_fees (user_id, payment_id, fee_amount, fee_percentage)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [userId, paymentId, amount, feePercentage]);

    return result.rows[0];
  } catch (error) {
    console.error('Error creating transaction fee:', error);
    return null;
  }
};

// Update customer tags
app.put('/api/customers/:customerId/tags', authenticateToken, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { tags } = req.body;
    const { userId } = req.user;

    const result = await pool.query(`
      UPDATE leads 
      SET tags = $1 
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [tags, customerId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ 
      success: true, 
      customer: result.rows[0] 
    });

  } catch (error) {
    console.error('Error updating customer tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create payment request endpoint
app.post('/api/create-payment-request', authenticateToken, async (req, res) => {
  try {
    const { amount, description, leadId, currency = 'ZAR' } = req.body;
    const { userId } = req.user;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get user's subscription plan
    const subscription = await pool.query(`
      SELECT sp.name as plan_name
      FROM user_subscriptions us
      LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
      WHERE us.user_id = $1 AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `, [userId]);

    const planType = subscription.rows.length > 0 ? subscription.rows[0].plan_name.toLowerCase() : 'free';

    // Calculate transaction fee
    const fee = calculateTransactionFee(amount, planType);

    // Create payment record in database
    const paymentResult = await pool.query(`
      INSERT INTO payments (business_id, lead_id, amount, currency, status, description)
      VALUES ($1, $2, $3, $4, 'pending', $5)
      RETURNING *
    `, [userId, leadId || null, amount, currency, description]);

    // Create transaction fee record
    await createTransactionFee(userId, paymentResult.rows[0].id, fee.feeAmount, fee.feePercentage);

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(), // Stripe uses lowercase currency codes
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-cancel`,
    });

    // Update payment record with Stripe session ID
    await pool.query(`
      UPDATE payments 
      SET stripe_session_id = $1 
      WHERE id = $2
    `, [session.id, paymentResult.rows[0].id]);

    res.json({
      success: true,
      url: session.url,
      paymentId: paymentResult.rows[0].id,
      sessionId: session.id,
      fee: fee
    });

  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ error: 'Error creating payment request' });
  }
});

// Add payment status update endpoint
app.post('/api/payment-webhook', async (req, res) => {
  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Update payment status
      await pool.query(`
        UPDATE payments 
        SET status = 'completed' 
        WHERE stripe_session_id = $1
      `, [session.id]);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
});

// Product management endpoints
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const products = await pool.query('SELECT * FROM products WHERE user_id = $1', [userId]);
    res.json(products.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, image_url, featured } = req.body;
    const { userId } = req.user;

    const productResult = await pool.query(
      'INSERT INTO products (user_id, name, description, price, category, image_url, featured) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, name, description, price, category, image_url, featured || false]
    );

    res.json(productResult.rows[0]);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, featured } = req.body;
    const { userId } = req.user;

    const productResult = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, category = $4, image_url = $5, featured = $6 WHERE id = $7 AND user_id = $8 RETURNING *',
      [name, description, price, category, image_url, featured, id, userId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(productResult.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const result = await pool.query('DELETE FROM products WHERE id = $1 AND user_id = $2', [id, userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product tags endpoints
app.get('/api/products/:productId/tags', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const tags = await pool.query('SELECT * FROM product_tags WHERE product_id = $1', [productId]);
    res.json(tags.rows);
  } catch (error) {
    console.error('Error fetching product tags:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products/:productId/tags', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const { tag } = req.body;

    const tagResult = await pool.query(
      'INSERT INTO product_tags (product_id, tag) VALUES ($1, $2) RETURNING *',
      [productId, tag]
    );

    res.json(tagResult.rows[0]);
  } catch (error) {
    console.error('Error adding product tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:productId/tags/:tagId', authenticateToken, async (req, res) => {
  try {
    const { productId, tagId } = req.params;

    const result = await pool.query('DELETE FROM product_tags WHERE id = $1 AND product_id = $2', [tagId, productId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting product tag:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Business profile management endpoints
app.put('/api/business/profile', authenticateToken, async (req, res) => {
  try {
    const { business_name, phone_number, industry, address, website, description } = req.body;
    const { userId } = req.user;

    const profileResult = await pool.query(
      'UPDATE business_profiles SET business_name = $1, phone_number = $2, industry = $3, address = $4, website = $5, description = $6 WHERE user_id = $7 RETURNING *',
      [business_name, phone_number, industry, address, website, description, userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Business profile not found' });
    }

    res.json(profileResult.rows[0]);
  } catch (error) {
    console.error('Error updating business profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/register
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, role, name, businessDetails } = req.body;

    if (!email || !password || !role || !['client', 'business'].includes(role)) {
      return res.status(400).json({ error: 'Missing required fields or invalid role' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userResult = await pool.query(
      'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id',
      [email, passwordHash, role, name || null]
    );

    const userId = userResult.rows[0].id;

    if (role === 'business' && businessDetails) {
      // Create business profile
      await pool.query(
        `INSERT INTO business_profiles (user_id, business_name, phone_number, industry, address, website, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          businessDetails.business_name,
          businessDetails.phone_number,
          businessDetails.industry,
          businessDetails.address || null,
          businessDetails.website || null,
          businessDetails.description || null
        ]
      );
    }

    // Generate JWT
    const token = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      success: true, 
      message: 'Registration successful',
      token,
      user: { id: userId, email, role }
    });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/user/profile (protected)
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const { userId, role } = req.user;

    const userResult = await pool.query('SELECT id, email, role, name, created_at FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (role === 'business') {
      const profileResult = await pool.query(
        'SELECT * FROM business_profiles WHERE user_id = $1',
        [userId]
      );
      user.business_profile = profileResult.rows[0];
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'RecoverFlow API is running' });
});

// Get business info
app.get('/api/business/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM businesses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle missed call
app.post('/api/missed-call', async (req, res) => {
  try {
    const { businessId, phoneNumber, callerId } = req.body;

    const business = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create lead
    const leadResult = await pool.query(
      'INSERT INTO leads (business_id, phone_number, source, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [businessId, callerId, 'missed_call', 'new']
    );

    // Send SMS
    const message = `Hi, this is ${business.rows[0].name}. Sorry we missed you. What service are you looking for?`;
    await twilio.messages.create({
      body: message,
      from: phoneNumber,
      to: callerId
    });

    // Create conversation
    await pool.query(
      'INSERT INTO conversations (business_id, lead_id, channel) VALUES ($1, $2, $3)',
      [businessId, leadResult.rows[0].id, 'sms']
    );

    res.json({ success: true, message: 'Missed call handled successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Website chat widget API
app.post('/api/website-chat', async (req, res) => {
  try {
    const { businessId, name, phone, service, budget, urgency } = req.body;

    const business = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    // Create lead
    const leadResult = await pool.query(
      'INSERT INTO leads (business_id, name, phone_number, source, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [businessId, name, phone, 'website_chat', 'new']
    );

    // Create conversation
    await pool.query(
      'INSERT INTO conversations (business_id, lead_id, channel) VALUES ($1, $2, $3)',
      [businessId, leadResult.rows[0].id, 'website']
    );

    // Qualification logic
    let response;
    if (budget < 500) {
      response = 'Thank you for your interest. We suggest exploring our basic services. Would you like more information?';
    } else if (urgency === 'urgent') {
      response = 'Your request is urgent! Our team will contact you immediately. In the meantime, would you like to book a consultation?';
    } else {
      response = `Great! We'd be happy to help with ${service}. Would you like to book an appointment?`;
    }

    res.json({ success: true, response, leadId: leadResult.rows[0].id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// No-show recovery
app.post('/api/no-show', async (req, res) => {
  try {
    const { businessId, phoneNumber } = req.body;

    const business = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

    const message = 'We noticed you missed your appointment. Would you like to reschedule?';
    await twilio.messages.create({
      body: message,
      from: business.rows[0].phone_number,
      to: phoneNumber
    });

    res.json({ success: true, message: 'No-show message sent' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create payment request
app.post('/api/create-payment-request', authenticateToken, async (req, res) => {
  try {
    const { amount, description, leadId } = req.body;
    const { userId } = req.user;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: description,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });

    // Create payment record
    await pool.query(
      'INSERT INTO payments (user_id, lead_id, amount, currency, status, stripe_session_id, description) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [userId, leadId, amount, 'USD', 'pending', session.id, description]
    );

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error creating payment request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment history for a business
app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const payments = await pool.query('SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(payments.rows);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get payment status
app.get('/api/payments/:paymentId', authenticateToken, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { userId } = req.user;

    const payment = await pool.query('SELECT * FROM payments WHERE id = $1 AND user_id = $2', [paymentId, userId]);
    
    if (payment.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment.rows[0]);
  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get conversations for business
app.get('/api/business/:id/conversations', async (req, res) => {
  try {
    const { id } = req.params;
    const conversations = await pool.query(`
      SELECT c.*, l.name as lead_name, l.phone_number
      FROM conversations c
      JOIN leads l ON c.lead_id = l.id
      WHERE c.business_id = $1
      ORDER BY c.created_at DESC
    `, [id]);

    res.json(conversations.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get analytics for business
app.get('/api/business/:id/analytics', async (req, res) => {
  try {
    const { id } = req.params;

    const leads = await pool.query('SELECT COUNT(*) FROM leads WHERE business_id = $1', [id]);
    const recovered = await pool.query('SELECT COUNT(*) FROM leads WHERE business_id = $1 AND status = $2', [id, 'converted']);
    const revenue = await pool.query('SELECT SUM(amount) FROM payments WHERE business_id = $1 AND status = $2', [id, 'completed']);
    const averageValue = await pool.query('SELECT AVG(amount) FROM payments WHERE business_id = $1 AND status = $2', [id, 'completed']);
    const conversations = await pool.query('SELECT COUNT(*) FROM conversations WHERE business_id = $1', [id]);

    res.json({
      totalLeads: parseInt(leads.rows[0].count),
      recoveredLeads: parseInt(recovered.rows[0].count),
      recoveryRate: leads.rows[0].count > 0 ? Math.round((parseInt(recovered.rows[0].count) / parseInt(leads.rows[0].count)) * 100) : 0,
      totalRevenue: parseFloat(revenue.rows[0].sum) || 0,
      averageOrderValue: parseFloat(averageValue.rows[0].avg) || 0,
      totalConversations: parseInt(conversations.rows[0].count),
      conversionRate: conversations.rows[0].count > 0 ? Math.round((parseInt(recovered.rows[0].count) / parseInt(conversations.rows[0].count)) * 100) : 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current time info
app.get('/api/time', (req, res) => {
  res.json(getTimeInfo());
});

// Get smart response based on form data
app.post('/api/smart-response', (req, res) => {
  try {
    const { service, budget, urgency, name } = req.body;
    const response = generateSmartResponse({ service, budget, urgency });
    const timeInfo = getTimeInfo();
    
    res.json({
      ...response,
      greeting: timeInfo.greeting,
      isBusinessHours: timeInfo.isBusinessHours,
      timestamp: timeInfo.formattedTime
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check business hours
app.get('/api/business-hours', (req, res) => {
  const timeInfo = getTimeInfo();
  res.json({
    isOpen: timeInfo.isBusinessHours,
    isWeekend: timeInfo.isWeekend,
    greeting: timeInfo.greeting,
    nextOpen: timeInfo.isBusinessHours ? 'Now' : '9:00 AM next business day'
  });
});

// Get message status (simulated)
app.get('/api/message-status/:id', (req, res) => {
  const { id } = req.params;
  const statuses = ['sent', 'delivered', 'read'];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  
  res.json({
    messageId: id,
    status: randomStatus,
    timestamp: new Date().toISOString()
  });
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST"]
  }
});

// Socket.io auth middleware
const socketAuth = (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = user;
    next();
  });
};

io.use(socketAuth);

// Socket events
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.userId}`);

  socket.on('userOnline', () => {
    socket.broadcast.emit('onlineUsers', socket.user.userId);
  });

  socket.on('joinChat', (conversationId) => {
    socket.join(`chat_${conversationId}`);
    console.log(`User ${socket.user.userId} joined chat ${conversationId}`);
  });

  socket.on('leaveChat', (conversationId) => {
    socket.leave(`chat_${conversationId}`);
  });

  socket.on('sendMessage', (message) => {
    // Broadcast to room
    socket.to(`chat_${message.conversation_id}`).emit('messages', [message]);
    io.to(`chat_${message.conversation_id}`).emit('chatsUpdated');
  });

  socket.on('typing', ({ conversationId, isTyping }) => {
    socket.to(`chat_${conversationId}`).emit('typing', {
      conversationId,
      userId: socket.user.userId,
      isTyping
    });
  });

  socket.on('messageRead', ({ conversationId, messageIds }) => {
    socket.to(`chat_${conversationId}`).emit('messageRead', { 
      conversationId, 
      messageIds 
    });
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.userId}`);
  });
});

server.listen(PORT, () => {
  console.log(`RecoverFlow server + Socket.io running on port ${PORT}`);
});

module.exports = app;

