import type { AdminEvent } from '../types';

const formatDateForCalendar = (date: string, time?: string): string => {
  const cleanDate = date.replace(/-/g, '');
  const cleanTime = time ? time.replace(/:/g, '') + '00' : '000000';
  return `${cleanDate}T${cleanTime}`;
};

export const generateGoogleCalendarUrl = (event: AdminEvent): string => {
  const startDate = event.startDate || new Date().toISOString().split('T')[0];
  const endDate = event.endDate || startDate;
  const startTime = event.startTime;
  const endTime = event.endTime;
  
  let dates = '';
  
  if (!startTime) {
    // All day event
    const start = startDate.replace(/-/g, '');
    // Google Calendar requires the day AFTER the end date for all-day events
    const endD = new Date(endDate);
    endD.setDate(endD.getDate() + 1);
    const end = endD.toISOString().split('T')[0].replace(/-/g, '');
    dates = `${start}/${end}`;
  } else {
    // Time-based event
    const start = formatDateForCalendar(startDate, startTime);
    
    // If no end time, default to 1 hour later
    let end = '';
    if (!endTime) {
        // Parse start time
        // Create a date object to handle hour rollover
        const d = new Date(startDate + 'T' + startTime);
        d.setHours(d.getHours() + 1);
        
        // Format back
        const endH = String(d.getHours()).padStart(2, '0');
        const endM = String(d.getMinutes()).padStart(2, '0');
        const endDay = d.toISOString().split('T')[0]; // In case it rolled over to next day
        
        end = formatDateForCalendar(endDay, `${endH}:${endM}`);
    } else {
        end = formatDateForCalendar(endDate, endTime);
    }
    
    dates = `${start}/${end}`;
  }

  const description = event.description || '';
  const location = event.meta?.find(m => m.label === 'WHERE')?.value || '';
  
  const url = new URL('https://calendar.google.com/calendar/render');
  url.searchParams.append('action', 'TEMPLATE');
  url.searchParams.append('text', event.title);
  url.searchParams.append('dates', dates);
  url.searchParams.append('details', description);
  url.searchParams.append('location', location);
  
  return url.toString();
};

export const generateOutlookCalendarUrl = (event: AdminEvent): string => {
  const startDate = event.startDate || new Date().toISOString().split('T')[0];
  const endDate = event.endDate || startDate;
  const startTime = event.startTime;
  const endTime = event.endTime;
  
  let start = '';
  let end = '';
  let isAllDay = false;

  if (!startTime) {
    // All day event
    isAllDay = true;
    start = new Date(startDate).toISOString();
    const endD = new Date(endDate);
    endD.setDate(endD.getDate() + 1);
    end = endD.toISOString();
  } else {
    // Time-based event
    start = new Date(`${startDate}T${startTime}`).toISOString();
    
    if (!endTime) {
        const d = new Date(`${startDate}T${startTime}`);
        d.setHours(d.getHours() + 1);
        end = d.toISOString();
    } else {
        end = new Date(`${endDate}T${endTime}`).toISOString();
    }
  }

  const description = event.description || '';
  const location = event.meta?.find(m => m.label === 'WHERE')?.value || '';
  
  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose');
  url.searchParams.append('subject', event.title);
  url.searchParams.append('body', description);
  url.searchParams.append('location', location);
  url.searchParams.append('startdt', start);
  url.searchParams.append('enddt', end);
  
  if (isAllDay) {
      url.searchParams.append('allday', 'true');
  }
  
  return url.toString();
};

export const downloadICS = (event: AdminEvent) => {
  const startDate = event.startDate || new Date().toISOString().split('T')[0];
  const endDate = event.endDate || startDate;
  const startTime = event.startTime;
  const endTime = event.endTime;
  
  let startLine = '';
  let endLine = '';

  if (!startTime) {
      // All day
      startLine = `DTSTART;VALUE=DATE:${startDate.replace(/-/g, '')}`;
      const endD = new Date(endDate);
      endD.setDate(endD.getDate() + 1);
      endLine = `DTEND;VALUE=DATE:${endD.toISOString().split('T')[0].replace(/-/g, '')}`;
  } else {
      startLine = `DTSTART:${formatDateForCalendar(startDate, startTime)}`;
      
      if (!endTime) {
           const d = new Date(startDate + 'T' + startTime);
           d.setHours(d.getHours() + 1);
           
           const endH = String(d.getHours()).padStart(2, '0');
           const endM = String(d.getMinutes()).padStart(2, '0');
           const endDay = d.toISOString().split('T')[0];
           
           endLine = `DTEND:${formatDateForCalendar(endDay, `${endH}:${endM}`)}`;
      } else {
           endLine = `DTEND:${formatDateForCalendar(endDate, endTime)}`;
      }
  }

  const description = event.description || '';
  const location = event.meta?.find(m => m.label === 'WHERE')?.value || '';
  
  // Basic ICS format
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Ballys Day At A Glance//NONSGML v1.0//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@ballys.com`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `SUMMARY:${event.title}`,
    startLine,
    endLine,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
