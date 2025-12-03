import { sql } from '../db';
import type { AdminEvent, Event, ScheduleItem } from '../types';
import { getDefaultPromotions, DEFAULT_SCHEDULES } from '../data';

const EVENTS_KEY = 'ballys_events';
const SCHEDULES_KEY = 'ballys_schedules';
const TAGS_KEY = 'ballys_tags';

// Helper to check if an event should be shown on a given date
export const shouldShowEvent = (event: AdminEvent, date: Date): boolean => {
  // Don't show archived events or templates in normal views
  if (event.isArchived || event.isTemplate) return false;

  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  // Recurring events (by day of week)
  if (event.isRecurring && event.daysOfWeek && event.daysOfWeek.length > 0) {
    const start = event.startDate || '0000-00-00';
    const end = event.endDate || '9999-12-31';
    return event.daysOfWeek.includes(dayOfWeek) && dateStr >= start && dateStr <= end;
  }

  // Date range events
  if (event.startDate && event.endDate) {
    return dateStr >= event.startDate && dateStr <= event.endDate;
  }

  // Single date events
  if (event.startDate) {
    return dateStr === event.startDate;
  }

  // Fallback: show if no date restrictions
  return true;
};

export const eventService = {
  // Get all event rules (AdminEvents)
  async getEvents(): Promise<AdminEvent[]> {
    try {
      // Try Neon/Postgres first if connected
      if (sql) {
        // Note: We assume the table 'events' exists and columns match or are compatible.
        // We cast the result to unknown then AdminEvent[] assuming the DB returns correct shape.
        // Complex fields like details/meta/daysOfWeek should be stored as JSONB.
        const data = await sql`SELECT * FROM events`;
        if (data && data.length > 0) {
          // Map DB snake_case or ensure camelCase is preserved. 
          // The neon driver usually returns what the query returns.
          // If we used "select *" and columns are camelCase (quoted) in creation, we get camelCase.
          // Or we map manually. For now, assume we get compatible objects.
          return data as unknown as AdminEvent[];
        }
      }
    } catch (e) {
      console.warn('Failed to fetch from DB, falling back to local storage');
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(EVENTS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse local events', e);
      }
    }

    // Fallback to defaults
    return getDefaultPromotions();
  },

  // Get events for a specific date (processed)
  async getEventsForDate(date: Date): Promise<Event[]> {
    const allEvents = await this.getEvents();

    return allEvents
      .filter(e => shouldShowEvent(e, date))
      .map(({ startDate, endDate, startTime, endTime, daysOfWeek, isRecurring, isArchived, isTemplate, ...event }) => event);
  },

  // Save all events (replace)
  async saveEvents(events: AdminEvent[]): Promise<void> {
    // Always save to localStorage for offline/backup
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    window.dispatchEvent(new Event('ballys_events_updated'));

    // Save to DB if connected
    if (sql) {
      try {
        // We'll iterate and upsert. 
        // Assuming 'id' is the primary key.
        for (const event of events) {
          // Ensure JSON fields are stringified if the driver doesn't auto-handle object->jsonb
          // Neon serverless driver usually handles objects as JSON parameters
          await sql`
                INSERT INTO events (
                    id, title, category, description, details, meta, media, highlight, 
                    "startDate", "endDate", "startTime", "endTime", "daysOfWeek", "isRecurring", property, "lastUpdated",
                    "isArchived", "isTemplate"
                ) VALUES (
                    ${event.id}, ${event.title}, ${event.category}, ${event.description || null}, 
                    ${JSON.stringify(event.details || [])}, ${JSON.stringify(event.meta || [])}, ${JSON.stringify(event.media || [])}, ${event.highlight || false},
                    ${event.startDate || null}, ${event.endDate || null}, ${event.startTime || null}, ${event.endTime || null},
                    ${JSON.stringify(event.daysOfWeek || [])}, ${event.isRecurring || false}, ${event.property || 'Both'}, ${event.lastUpdated || new Date().toISOString()},
                    ${event.isArchived || false}, ${event.isTemplate || false}
                )
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    category = EXCLUDED.category,
                    description = EXCLUDED.description,
                    details = EXCLUDED.details,
                    meta = EXCLUDED.meta,
                    media = EXCLUDED.media,
                    highlight = EXCLUDED.highlight,
                    "startDate" = EXCLUDED."startDate",
                    "endDate" = EXCLUDED."endDate",
                    "startTime" = EXCLUDED."startTime",
                    "endTime" = EXCLUDED."endTime",
                    "daysOfWeek" = EXCLUDED."daysOfWeek",
                    "isRecurring" = EXCLUDED."isRecurring",
                    property = EXCLUDED.property,
                    "lastUpdated" = EXCLUDED."lastUpdated",
                    "isArchived" = EXCLUDED."isArchived",
                    "isTemplate" = EXCLUDED."isTemplate"
            `;
        }

        // Optionally handle deletions (events not in the list)
        // DELETE FROM events WHERE id NOT IN (${events.map(e => e.id)})
        if (events.length > 0) {
          const ids = events.map(e => e.id);
          await sql`DELETE FROM events WHERE id != ALL(${ids})`;
        } else {
          await sql`DELETE FROM events`;
        }

      } catch (e) {
        console.error('DB save error:', e);
      }
    }
  },

  // Get schedules
  async getSchedules(): Promise<Record<string, ScheduleItem[]>> {
    try {
      if (sql) {
        // Assuming a 'schedules' table with 'category' (text PK) and 'items' (jsonb)
        const data = await sql`SELECT category, items FROM schedules`;
        if (data && data.length > 0) {
          const schedules: Record<string, ScheduleItem[]> = {};
          data.forEach((row: any) => {
            schedules[row.category] = row.items; // items is automatically parsed from JSONB
          });
          return schedules;
        }
      }
    } catch (e) {
      console.warn('Failed to fetch schedules from DB', e);
    }

    const saved = localStorage.getItem(SCHEDULES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_SCHEDULES;
  },

  async saveSchedules(schedules: Record<string, ScheduleItem[]>): Promise<void> {
    localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
    window.dispatchEvent(new Event('ballys_schedules_updated'));

    if (sql) {
      try {
        // Upsert each category
        for (const [category, items] of Object.entries(schedules)) {
          await sql`
                    INSERT INTO schedules (category, items)
                    VALUES (${category}, ${JSON.stringify(items)})
                    ON CONFLICT (category) DO UPDATE SET items = EXCLUDED.items
                `;
        }

        // Handle deletions
        const categories = Object.keys(schedules);
        if (categories.length > 0) {
          await sql`DELETE FROM schedules WHERE category != ALL(${categories})`;
        } else {
          await sql`DELETE FROM schedules`;
        }
      } catch (e) {
        console.error('DB schedule save error:', e);
      }
    }
  },

  // Tags Management
  async getTags(): Promise<string[]> {
    try {
        if (sql) {
            const data = await sql`SELECT name FROM tags ORDER BY name ASC`;
            if (data) return data.map((r: any) => r.name);
        }
    } catch (e) {
        console.warn('Failed to fetch tags from DB');
    }
    
    const saved = localStorage.getItem(TAGS_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  async saveTag(tag: string): Promise<void> {
    // Local Storage
    const currentTags = await this.getTags();
    if (!currentTags.includes(tag)) {
        const newTags = [...currentTags, tag];
        localStorage.setItem(TAGS_KEY, JSON.stringify(newTags));
    }

    // DB
    if (sql) {
        try {
            await sql`
                INSERT INTO tags (id, name) 
                VALUES (${tag.toLowerCase().replace(/\s+/g, '-')}, ${tag})
                ON CONFLICT (id) DO NOTHING
            `;
        } catch(e) {
            console.error('Failed to save tag to DB', e);
        }
    }
  },

  // Initialize Database Tables
  async initDatabase(): Promise<void> {
    if (!sql) return;

    try {
      await sql`
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
      `;

      // Attempt to add media column if it doesn't exist (migration)
      try {
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS media JSONB;`;
      } catch (e) {}

      // Attempt to add property column if it doesn't exist (migration)
      try {
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS property TEXT DEFAULT 'Both';`;
      } catch (e) {}

      // Attempt to add lastUpdated column if it doesn't exist (migration)
      try {
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS "lastUpdated" TEXT;`;
      } catch (e) {}

      // Attempt to add isArchived column if it doesn't exist (migration)
      try {
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS "isArchived" BOOLEAN DEFAULT FALSE;`;
      } catch (e) {}

      // Attempt to add isTemplate column if it doesn't exist (migration)
      try {
        await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS "isTemplate" BOOLEAN DEFAULT FALSE;`;
      } catch (e) {}

      await sql`
        CREATE TABLE IF NOT EXISTS schedules (
          category TEXT PRIMARY KEY,
          items JSONB NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          ip_address TEXT NOT NULL UNIQUE,
          username TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS interactions (
          id TEXT PRIMARY KEY,
          event_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          type TEXT NOT NULL,
          content TEXT,
          created_at TEXT NOT NULL
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS mail_jobs (
          id TEXT PRIMARY KEY,
          campaign_name TEXT NOT NULL,
          mail_type TEXT,
          property TEXT,
          job_submitted BOOLEAN DEFAULT FALSE,
          postage TEXT,
          quantity INTEGER,
          in_home_date TEXT,
          first_valid_date TEXT,
          vendor_mail_date TEXT,
          milestones JSONB,
          created_at TEXT NOT NULL
        );
      `;

      console.log('Database initialized successfully');
    } catch (e) {
      console.error('Failed to initialize database:', e);
      throw e;
    }
  }
};
