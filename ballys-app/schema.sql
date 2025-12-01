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

CREATE TABLE IF NOT EXISTS schedules (
  category TEXT PRIMARY KEY,
  items JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  "expirationDate" TEXT,
  "createdAt" TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'aura' or 'comment'
  content TEXT,
  created_at TEXT NOT NULL
);
