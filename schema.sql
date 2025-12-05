-- Enable UUID extension if needed, though we are using text IDs in the app
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table (if you want to store events in DB)
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  details JSONB,
  meta JSONB,
  media JSONB,
  highlight BOOLEAN DEFAULT FALSE,
  "startDate" TEXT,
  "endDate" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "daysOfWeek" JSONB,
  "isRecurring" BOOLEAN DEFAULT FALSE,
  property TEXT DEFAULT 'Both',
  "lastUpdated" TEXT
);

-- Schedules Table
CREATE TABLE IF NOT EXISTS schedules (
  category TEXT PRIMARY KEY,
  items JSONB NOT NULL
);

-- Tags Table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- Interactions Table (Aura and Comments)
CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('aura', 'comment', 'like', 'reaction')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active Sessions Table (For live user count)
CREATE TABLE IF NOT EXISTS active_sessions (
  id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Promotion Views Table
CREATE TABLE IF NOT EXISTS promotion_views (
  promotion_id TEXT PRIMARY KEY,
  count INTEGER DEFAULT 0,
  last_viewed TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_interactions_event_id ON interactions(event_id);
CREATE INDEX IF NOT EXISTS idx_interactions_user_id ON interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_interactions_type ON interactions(type);
CREATE INDEX IF NOT EXISTS idx_users_ip_address ON users(ip_address);
