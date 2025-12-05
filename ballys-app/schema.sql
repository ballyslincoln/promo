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
  "lastUpdated" TEXT,
  "isArchived" BOOLEAN DEFAULT FALSE,
  "isTemplate" BOOLEAN DEFAULT FALSE
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

CREATE TABLE IF NOT EXISTS mail_jobs (
  id TEXT PRIMARY KEY,
  campaign_name TEXT NOT NULL,
  mail_type TEXT,
  property TEXT,
  property_review BOOLEAN DEFAULT FALSE,
  property_review_start TEXT, -- ISO string for when review started
  job_submitted BOOLEAN DEFAULT FALSE, -- DEPRECATED: Use submitted_date instead
  submitted_date TEXT, -- New field for tracking artwork submission date
  postage TEXT,
  quantity INTEGER,
  in_home_date TEXT,
  first_valid_date TEXT,
  vendor_mail_date TEXT,
  milestones JSONB,
  tags JSONB,
  created_at TEXT NOT NULL
);

-- Attempt to add 'tags' column if it doesn't exist
ALTER TABLE mail_jobs ADD COLUMN IF NOT EXISTS tags JSONB;

CREATE TABLE IF NOT EXISTS admins (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pin TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TEXT NOT NULL,
  last_login TEXT
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT,
  admin_name TEXT,
  action_type TEXT NOT NULL,
  description TEXT,
  timestamp TEXT NOT NULL,
  metadata JSONB
);
