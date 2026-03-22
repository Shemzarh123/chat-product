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
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255),
  phone_number VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  source VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'new',
  service_interest VARCHAR(255),
  budget INTEGER,
  urgency VARCHAR(50),
  notes TEXT,
  tags TEXT[], -- Array of tags like 'lead', 'repeat buyer', 'VIP'
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

-- Users table for authentication (clients/business owners/investors/agencies)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('client', 'business')),
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business profiles table (for business owners/investors/agencies)
CREATE TABLE business_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  address TEXT,
  website VARCHAR(255),
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products/Services catalog for businesses
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category VARCHAR(100),
  image_url VARCHAR(255),
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product tags for filtering
CREATE TABLE product_tags (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  tag VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table for smart notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  priority VARCHAR(20) DEFAULT 'normal',
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_priority ON notifications(priority);

-- Subscription plans table
CREATE TABLE subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  duration VARCHAR(50) NOT NULL, -- 'monthly', 'yearly'
  features TEXT[],
  max_products INTEGER,
  max_leads INTEGER,
  ai_features BOOLEAN DEFAULT FALSE,
  analytics BOOLEAN DEFAULT FALSE,
  support_level VARCHAR(50) DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions table
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  plan_id INTEGER REFERENCES subscription_plans(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'canceled', 'expired'
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  stripe_subscription_id VARCHAR(255),
  last_payment_date TIMESTAMP,
  next_payment_date TIMESTAMP,
  currency VARCHAR(10) DEFAULT 'ZAR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction fees table
CREATE TABLE transaction_fees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  payment_id INTEGER REFERENCES payments(id),
  fee_amount NUMERIC(10, 2) NOT NULL,
  fee_percentage NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create default subscription plans
INSERT INTO subscription_plans (name, description, price, duration, features, max_products, max_leads, ai_features, analytics, support_level) VALUES
('Free', 'Basic plan for small businesses', 0.00, 'monthly', '{"Basic messaging", "Up to 5 products", "Email support"}', 5, 20, false, false, 'standard'),
('Pro', 'Advanced features for growing businesses', 29.99, 'monthly', '{"Unlimited messaging", "Unlimited products", "AI assistant", "Analytics", "Priority support"}', NULL, NULL, true, true, 'priority'),
('Enterprise', 'Complete solution for large enterprises', 99.99, 'monthly', '{"All Pro features", "API access", "Custom integrations", "24/7 support", "Dedicated account manager"}', NULL, NULL, true, true, 'premium');

-- Update existing tables to reference business_profiles.user_id instead of businesses.id
ALTER TABLE leads ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE leads ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE conversations ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE conversations ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE appointments ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE appointments ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE payments ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE payments ADD COLUMN user_id INTEGER REFERENCES users(id);
ALTER TABLE analytics ALTER COLUMN business_id DROP NOT NULL;
ALTER TABLE analytics ADD COLUMN user_id INTEGER REFERENCES users(id);

-- Indexes for new tables
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_leads_user_id ON leads(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- Sample auth data for testing
INSERT INTO users (email, password_hash, role, name) VALUES
('admin@recoverflow.com', '$2b$10$examplehashforadmin', 'business', 'Admin User'),
('client@test.com', '$2b$10$examplehashforclient', 'client', 'Test Client');

INSERT INTO business_profiles (user_id, business_name, phone_number, email, industry, address) VALUES
(1, 'Bright Smile Dental Clinic', '+1234567890', 'info@brightsmile.com', 'dental', '123 Main St, New York, NY 10001');
