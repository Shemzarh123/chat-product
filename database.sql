-- RecoverFlow Database Schema

-- Create database
CREATE DATABASE recoverflow;

-- Connect to database
\c recoverflow;

-- Businesses table
CREATE TABLE businesses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leads table
CREATE TABLE leads (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  name VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  source VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  service_interest VARCHAR(255),
  budget INTEGER,
  urgency VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Conversations table
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  lead_id INTEGER REFERENCES leads(id),
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),
  sender VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  channel VARCHAR(50) NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  lead_id INTEGER REFERENCES leads(id),
  appointment_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'scheduled',
  service VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  lead_id INTEGER REFERENCES leads(id),
  amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  stripe_session_id VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table (to track revenue recovery)
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  business_id INTEGER REFERENCES businesses(id),
  date DATE NOT NULL,
  leads_generated INTEGER DEFAULT 0,
  leads_converted INTEGER DEFAULT 0,
  revenue_recovered NUMERIC(10, 2) DEFAULT 0.00,
  missed_calls INTEGER DEFAULT 0,
  website_chats INTEGER DEFAULT 0,
  no_shows INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for faster queries
CREATE INDEX idx_leads_business_id ON leads(business_id);
CREATE INDEX idx_conversations_business_id ON conversations(business_id);
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_appointments_business_id ON appointments(business_id);
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_analytics_business_id ON analytics(business_id);
CREATE INDEX idx_analytics_date ON analytics(date);

-- Sample data for development
INSERT INTO businesses (name, phone_number, email, industry, address) VALUES
('Bright Smile Dental Clinic', '+1234567890', 'info@brightsmile.com', 'dental', '123 Main St, New York, NY 10001');

INSERT INTO leads (business_id, name, phone_number, email, source, status, service_interest, budget, urgency) VALUES
(1, 'John Doe', '+1987654321', 'john@example.com', 'missed_call', 'new', 'dental_implants', 3000, 'normal'),
(1, 'Jane Smith', '+1122334455', 'jane@example.com', 'website_chat', 'qualified', 'teeth_whitening', 800, 'urgent');

INSERT INTO conversations (business_id, lead_id, channel) VALUES
(1, 1, 'sms'),
(1, 2, 'website');

INSERT INTO messages (conversation_id, sender, content, channel, read) VALUES
(1, 'system', 'Hi, this is Bright Smile Dental Clinic. Sorry we missed you. What service are you looking for?', 'sms', false),
(2, 'system', 'Great! We''d be happy to help with teeth whitening. Would you like to book an appointment?', 'website', false);