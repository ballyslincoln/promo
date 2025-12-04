export interface EventDetail {
  label: string;
  value: string;
}

export interface MediaItem {
  type: 'image' | 'pdf';
  url: string; // Base64 data URI
  name?: string;
}

export interface Event {
  id: string;
  title: string;
  category: 'Invited' | 'Open' | 'Dining' | 'Promo' | 'Internal' | 'Schedule' | 'Entertainment';
  description?: string;
  details?: string[]; // Bullet points
  meta?: EventDetail[]; // Key-value pairs like WHEN, WHERE
  media?: MediaItem[];
  highlight?: boolean;
  property?: 'Lincoln' | 'Tiverton' | 'Both';
}

export interface AdminEvent extends Event {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isRecurring?: boolean;
  lastUpdated?: string; // ISO string for sort by last edited
  isArchived?: boolean;
  isTemplate?: boolean;
}

export interface ScheduleItem {
  name: string;
  time: string;
}

export type AnnouncementType = 'info' | 'warning' | 'error';

export interface Announcement {
  id: string;
  message: string;
  type: AnnouncementType;
  active: boolean;
  expirationDate?: string; // ISO string
  createdAt: string; // ISO string
}

export interface User {
  id: string;
  ip_address: string;
  username: string;
  created_at: string;
}

export interface Admin {
  id: string;
  username: string;
  pin: string;
  role: 'master' | 'admin';
  created_at: string;
  last_login?: string;
}

export interface ActivityLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action_type: string;
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface Interaction {
  id: string;
  event_id: string;
  user_id: string;
  type: 'aura' | 'comment' | 'like';
  content?: string;
  created_at: string;
  username?: string; // Joined field
  likes?: number;
  hasLiked?: boolean;
}
