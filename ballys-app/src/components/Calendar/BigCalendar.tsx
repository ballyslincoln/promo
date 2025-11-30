import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar-styles.css'; // We'll create this for custom styling
import type { AdminEvent } from '../../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface BigCalendarProps {
  events: AdminEvent[];
  onSelectEvent?: (event: AdminEvent) => void;
  onSelectSlot?: (slotInfo: { start: Date; end: Date }) => void;
  readOnly?: boolean;
  defaultView?: View;
}

// Custom Toolbar Component
const CustomToolbar = (toolbar: any) => {
  const goToBack = () => {
    toolbar.onNavigate('PREV');
  };

  const goToNext = () => {
    toolbar.onNavigate('NEXT');
  };

  const goToCurrent = () => {
    toolbar.onNavigate('TODAY');
  };

  const label = () => {
    const date = toolbar.date;
    return format(date, 'MMMM yyyy');
  };

  return (
    <div className="flex items-center justify-between mb-4 p-4 bg-surface border-b border-border rounded-t-2xl">
      <div className="flex items-center gap-4">
        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg">
           <button
            onClick={() => toolbar.onView('month')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${toolbar.view === 'month' ? 'bg-surface text-ballys-red shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Month
          </button>
          <button
            onClick={() => toolbar.onView('week')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${toolbar.view === 'week' ? 'bg-surface text-ballys-red shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Week
          </button>
          <button
            onClick={() => toolbar.onView('day')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${toolbar.view === 'day' ? 'bg-surface text-ballys-red shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Day
          </button>
        </div>
        <h2 className="text-xl font-bold text-text-main capitalize">
          {label()}
        </h2>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={goToBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-text-light hover:text-text-main"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToCurrent}
          className="px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors uppercase tracking-wider"
        >
          Today
        </button>
        <button
          onClick={goToNext}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-text-light hover:text-text-main"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Custom Event Component
const CustomEvent = ({ event }: { event: any }) => {
  const adminEvent = event.resource as AdminEvent;
  
  return (
    <div className="h-full w-full overflow-hidden text-white">
      <div className="flex items-center gap-1 mb-0.5">
        {adminEvent.startTime && (
           <span className="text-[10px] font-mono opacity-80">{adminEvent.startTime}</span>
        )}
      </div>
      <div className="font-bold text-xs leading-tight truncate">
        {event.title}
      </div>
      {adminEvent.category && (
        <div className="text-[9px] opacity-90 uppercase tracking-wider mt-0.5 truncate">
          {adminEvent.category}
        </div>
      )}
    </div>
  );
};

export default function BigCalendar({ events, onSelectEvent, onSelectSlot, readOnly = false, defaultView = Views.MONTH }: BigCalendarProps) {
  const [view, setView] = useState<View>(defaultView);

  // Transform AdminEvents to Calendar Events
  const calendarEvents = useMemo(() => {
    const mappedEvents: any[] = [];
    
    events.forEach(event => {
      // Handle date strings
      const startDateStr = event.startDate || new Date().toISOString().split('T')[0];
      const endDateStr = event.endDate || startDateStr;
      
      // Handle time strings
      const startTimeStr = event.startTime || '00:00';
      const endTimeStr = event.endTime || '23:59';

      // Create Date objects
      const start = new Date(`${startDateStr}T${startTimeStr}`);
      const end = new Date(`${endDateStr}T${endTimeStr}`);

      // Handle recurring events (simple expansion for current view range could be complex, 
      // but for now let's just map the base event if it's a single instance or let the parent handle expansion.
      // Since the parent 'Dashboard' already has logic to filter events by day, 
      // we might need to expand recurring events here if we want them to show up on all days in Month view.
      
      // For this implementation, let's assume 'events' passed in are "Rules" and we need to expand them 
      // OR we rely on the parent to pass expanded events.
      // The current 'events' prop is AdminEvent[] which are rules.
      
      // Let's expand for a reasonable range (e.g. +/- 1 year) or just for the current view? 
      // React-big-calendar expects concrete date instances.
      
      if (event.isRecurring && event.daysOfWeek && event.daysOfWeek.length > 0) {
         // Expand recurring events for the next 3 months and previous 1 month from now
         // A better approach is to expand based on the visible range, but we don't have easy access to that in this transform without state.
         // Let's just expand for the current year + next year.
         
         const expandStart = new Date();
         expandStart.setMonth(expandStart.getMonth() - 1);
         const expandEnd = new Date();
         expandEnd.setFullYear(expandEnd.getFullYear() + 1);
         
         let current = new Date(expandStart);
         while (current <= expandEnd) {
             if (event.daysOfWeek.includes(current.getDay())) {
                 const eventStart = new Date(current);
                 const [sh, sm] = startTimeStr.split(':').map(Number);
                 eventStart.setHours(sh, sm, 0);
                 
                 const eventEnd = new Date(current);
                 const [eh, em] = endTimeStr.split(':').map(Number);
                 eventEnd.setHours(eh, em, 0);
                 
                 mappedEvents.push({
                     id: `${event.id}-${current.toISOString().split('T')[0]}`,
                     title: event.title,
                     start: eventStart,
                     end: eventEnd,
                     resource: event,
                     allDay: false // or check if times cover full day
                 });
             }
             current.setDate(current.getDate() + 1);
         }
      } else {
          mappedEvents.push({
            id: event.id,
            title: event.title,
            start,
            end,
            resource: event,
            allDay: !event.startTime // Assume all day if no start time? Or strict check.
          });
      }
    });
    
    return mappedEvents;
  }, [events]);

  const eventStyleGetter = (event: any) => {
    const adminEvent = event.resource as AdminEvent;
    let backgroundColor = '#3174ad';
    let color = 'white';
    
    // Custom colors based on category
    switch (adminEvent.category) {
        case 'Invited': backgroundColor = '#FBBF24'; color = '#000'; break; // Amber
        case 'Open': backgroundColor = '#EF4444'; break; // Red
        case 'Dining': backgroundColor = '#3B82F6'; break; // Blue
        case 'Promo': backgroundColor = '#8B5CF6'; break; // Purple
        case 'Entertainment': backgroundColor = '#EC4899'; break; // Pink
        case 'Schedule': backgroundColor = '#10B981'; break; // Green
        case 'Internal': backgroundColor = '#6B7280'; break; // Gray
    }

    if (adminEvent.highlight) {
        // backgroundColor = '#D97706'; // Darker amber
    }

    return {
      style: {
        backgroundColor,
        color,
        borderRadius: '6px',
        border: 'none',
        display: 'block',
        opacity: 0.9,
        fontSize: '0.8rem',
        padding: '2px 4px'
      }
    };
  };

  return (
    <div className="h-[700px] bg-surface rounded-2xl shadow-sm border border-border overflow-hidden text-text-main">
      <Calendar
        localizer={localizer}
        events={calendarEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        views={['month', 'week', 'day']}
        view={view}
        onView={setView}
        selectable={!readOnly}
        onSelectEvent={(e) => onSelectEvent && onSelectEvent(e.resource)}
        onSelectSlot={(slotInfo) => onSelectSlot && onSelectSlot({ start: slotInfo.start as Date, end: slotInfo.end as Date })}
        components={{
          toolbar: CustomToolbar,
          event: CustomEvent
        }}
        eventPropGetter={eventStyleGetter}
        popup
      />
    </div>
  );
}
