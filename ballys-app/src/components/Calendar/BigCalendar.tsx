import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import type { View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
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
    <div className="flex flex-col md:flex-row items-center justify-between mb-4 p-3 md:p-4 bg-surface border-b border-border rounded-t-2xl gap-3 md:gap-0">
      <div className="flex items-center justify-between w-full md:w-auto gap-4">
        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-lg scale-90 md:scale-100 origin-left">
           <button
            onClick={() => toolbar.onView('month')}
            className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${toolbar.view === 'month' ? 'bg-surface text-ballys-red shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Month
          </button>
          <button
            onClick={() => toolbar.onView('week')}
            className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${toolbar.view === 'week' ? 'bg-surface text-ballys-red shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Week
          </button>
          <button
            onClick={() => toolbar.onView('day')}
            className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all ${toolbar.view === 'day' ? 'bg-surface text-ballys-red shadow-sm' : 'text-text-muted hover:text-text-main'}`}
          >
            Day
          </button>
        </div>
        <h2 className="text-base md:text-xl font-bold text-text-main capitalize truncate">
          {label()}
        </h2>
      </div>

      <div className="flex items-center gap-1 md:gap-2 w-full md:w-auto justify-between md:justify-end">
        <button
          onClick={goToBack}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full transition-colors text-text-light hover:text-text-main"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goToCurrent}
          className="px-3 py-1.5 text-xs md:text-sm font-medium text-text-muted hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors uppercase tracking-wider"
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

// Custom Date Header Component
const CustomDateHeader = ({ label, date, onDrillDown }: any) => {
  const isToday = isSameDay(new Date(), date);
  
  return (
    <div className="rbc-date-cell px-2 pt-2">
      <button
        onClick={onDrillDown}
        className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium transition-all ${
          isToday 
            ? 'bg-ballys-red text-white shadow-md scale-110' 
            : 'text-text-muted hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
      >
        {label}
      </button>
    </div>
  );
};

// Custom Event Component
const CustomEvent = ({ event }: { event: any }) => {
  const adminEvent = event.resource as AdminEvent;
  
  return (
    <div className="h-full w-full overflow-hidden text-white px-1 py-0.5 flex items-center gap-1">
      {adminEvent.startTime && (
         <span className="text-[9px] font-mono opacity-90 whitespace-nowrap">{adminEvent.startTime}</span>
      )}
      <div className="font-bold text-[10px] leading-tight truncate">
        {event.title}
      </div>
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

      if (event.isRecurring && event.daysOfWeek && event.daysOfWeek.length > 0) {
         // Expand recurring events for the next 3 months and previous 1 month from now
         const expandStart = new Date();
         expandStart.setMonth(expandStart.getMonth() - 1);
         const expandEnd = new Date();
         expandEnd.setMonth(expandEnd.getMonth() + 3);
         
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
                     allDay: false 
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
            allDay: !event.startTime
          });
      }
    });
    
    return mappedEvents;
  }, [events]);

  const eventStyleGetter = (event: any) => {
    const adminEvent = event.resource as AdminEvent;
    let backgroundColor = '#3174ad';
    let color = 'white';
    
    switch (adminEvent.category) {
        case 'Invited': backgroundColor = '#FBBF24'; color = '#000'; break;
        case 'Open': backgroundColor = '#EF4444'; break;
        case 'Dining': backgroundColor = '#3B82F6'; break;
        case 'Promo': backgroundColor = '#8B5CF6'; break;
        case 'Entertainment': backgroundColor = '#EC4899'; break;
        case 'Schedule': backgroundColor = '#10B981'; break;
        case 'Internal': backgroundColor = '#6B7280'; break;
    }

    return {
      style: {
        backgroundColor,
        color,
        borderRadius: '4px',
        border: 'none',
        display: 'block',
        opacity: 0.9,
        fontSize: '0.75rem',
        padding: '1px 2px'
      }
    };
  };

  return (
    <div className="h-[600px] md:h-[800px] bg-surface rounded-2xl shadow-sm border border-border text-text-main relative">
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
          month: {
            dateHeader: CustomDateHeader
          },
          event: CustomEvent
        }}
        onDrillDown={(date) => {
          if (onSelectSlot) {
            onSelectSlot({ start: date, end: date });
          }
        }}
        eventPropGetter={eventStyleGetter}
        popup
        popupOffset={10}
      />
    </div>
  );
}