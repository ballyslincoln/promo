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
}

export interface ScheduleItem {
  name: string;
  time: string;
}

