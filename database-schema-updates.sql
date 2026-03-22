-- Chat Schema Updates for WhatsApp Features

-- Add chat-specific fields if not exist
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status_story JSONB;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;

-- Message enhancements
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to INTEGER REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'sent';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_status ON messages(conversation_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);

-- Sample chats for testing (users/business have leads/conversations)
INSERT INTO conversations (user_id, lead_id, channel, last_message) VALUES
(1, 1, 'whatsapp', 'Welcome to our WhatsApp business chat!'),
(1, 2, 'whatsapp', 'Thanks for your interest in our services.');

INSERT INTO messages (conversation_id, sender, content, type, status) VALUES
(1, 'contact', 'Hi, I need dental consultation', 'text', 'read'),
(1, 'business', 'Great! When would you like to schedule?', 'text', 'sent');

-- Run: psql -d recoverflow -f database-schema-updates.sql

