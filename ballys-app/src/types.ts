export interface EventDetail {
  label: string;
  value: string;
}

export interface Event {
  id: string;
  title: string;
  category: 'Invited' | 'Open' | 'Dining' | 'Promo' | 'Internal' | 'Schedule' | 'Entertainment';
  description?: string;
  details?: string[]; // Bullet points
  meta?: EventDetail[]; // Key-value pairs like WHEN, WHERE
  highlight?: boolean;
}

export interface AdminEvent extends Event {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isRecurring?: boolean;
}

export interface ScheduleItem {
  name: string;
  time: string;
}

