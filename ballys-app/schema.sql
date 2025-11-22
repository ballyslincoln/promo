CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  details JSONB,
  meta JSONB,
  highlight BOOLEAN DEFAULT FALSE,
  "startDate" TEXT,
  "endDate" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "daysOfWeek" JSONB,
  "isRecurring" BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS schedules (
  category TEXT PRIMARY KEY,
  items JSONB NOT NULL
);

