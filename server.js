const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('frontend/build'));

// Catch-all route for SPA - must be after static files
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build/index.html'));
});

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

// Create deposit link
app.post('/api/create-deposit', async (req, res) => {
  try {
    const { businessId, amount, description } = req.body;

    const business = await pool.query('SELECT * FROM businesses WHERE id = $1', [businessId]);
    if (business.rows.length === 0) {
      return res.status(404).json({ error: 'Business not found' });
    }

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
      success_url: `${process.env.FRONTEND_URL}/deposit-success`,
      cancel_url: `${process.env.FRONTEND_URL}/deposit-cancel`,
    });

    res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Error:', error);
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

    res.json({
      totalLeads: parseInt(leads.rows[0].count),
      recoveredLeads: parseInt(recovered.rows[0].count),
      recoveryRate: leads.rows[0].count > 0 ? Math.round((parseInt(recovered.rows[0].count) / parseInt(leads.rows[0].count)) * 100) : 0
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

app.listen(PORT, () => {
  console.log(`RecoverFlow server running on port ${PORT}`);
});

module.exports = app;
