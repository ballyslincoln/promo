export interface EventDetail {
  label: string;
  value: string;
}

export interface Event {
  id: string;
  title: string;
  category: 'Invited' | 'Open' | 'Dining' | 'Promo' | 'Internal' | 'Schedule';
  description?: string;
  details?: string[]; // Bullet points
  meta?: EventDetail[]; // Key-value pairs like WHEN, WHERE
  highlight?: boolean;
}

export interface ScheduleItem {
  name: string;
  time: string;
}

export const PHONE_NUMBERS = [
  { name: "Players Club", number: "340-2862" },
  { name: "Facilities (Emergency)", number: "340-1275" },
  { name: "Security Command", number: "340-2008" },
  { name: "Front Desk", number: "340-2438" },
  { name: "Slots Shift Manager", number: "340-2628" },
  { name: "Tables Shift Manager", number: "412-6486" },
  { name: "EVS - Clean Team", number: "289-5145" },
  { name: "I.T. Dept.", number: "4357" },
];

export const DEFAULT_SCHEDULES: Record<string, ScheduleItem[]> = {
  "Restaurants & Bars": [
    { name: "Dunkin Donuts", time: "24 Hours" },
    { name: "Carousel Bar", time: "24 Hours" },
    { name: "Macau Kitchen", time: "2pm – 10pm" },
    { name: "Jerry Longo's", time: "4pm – 9pm (Marketing Menu)" },
    { name: "Park Place Prime", time: "4pm – 9pm" },
    { name: "Casino Café & Grille", time: "8am – 2pm" },
    { name: "Legacy Lounge", time: "4pm – 9pm" },
    { name: "Room Service", time: "CLOSED" },
    { name: "Pool Deck Bar", time: "11:30am – 6:30pm" },
    { name: "The Yard", time: "2pm – 10pm" },
    { name: "Beach Bar", time: "11am – 10pm" },
  ],
  "3rd Party Outlets": [
    { name: "Johnny Rockets", time: "10:30am – 12am" },
    { name: "Carluccio's", time: "11am – 11pm" },
    { name: "Sack O' Subs", time: "10:30am – 10pm" },
  ],
  "Players Club": [
    { name: "Dennis Tower Hallway (2nd Level)", time: "10am – 8pm" }
  ],
  "Important Numbers": PHONE_NUMBERS.map(p => ({ name: p.name, time: p.number }))
};

// Get schedules from localStorage or return defaults
export const getSchedules = (): Record<string, ScheduleItem[]> => {
  const saved = localStorage.getItem('ballys_schedules');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse schedules:', e);
    }
  }
  return DEFAULT_SCHEDULES;
};

// For backward compatibility
export const SCHEDULES = DEFAULT_SCHEDULES;


// Extended event interface for admin panel
export interface AdminEvent extends Event {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isRecurring?: boolean;
}

// Get events from localStorage if available, otherwise use defaults
const getStoredEvents = (): AdminEvent[] => {
  const saved = localStorage.getItem('ballys_events');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse stored events:', e);
    }
  }
  return [];
};

// Check if an event should be shown on a given date
const shouldShowEvent = (event: AdminEvent, date: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  // Recurring events (by day of week)
  if (event.isRecurring && event.daysOfWeek && event.daysOfWeek.length > 0) {
    return event.daysOfWeek.includes(dayOfWeek);
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

// Helper function to check if a date falls within a range
const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];
  return dateStr >= startStr && dateStr <= endStr;
};

// Helper function to create a date from month, day, year
const createDate = (year: number, month: number, day: number): Date => {
  return new Date(year, month - 1, day);
};

export const getEventsForDate = (date: Date): Event[] => {
  const events: Event[] = [];
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, etc.

  // First, load events from localStorage (admin-managed)
  const storedEvents = getStoredEvents();
  const matchingStoredEvents = storedEvents
    .filter(e => shouldShowEvent(e, date))
    .map(({ startDate, endDate, startTime, endTime, daysOfWeek, isRecurring, ...event }) => event);
  events.push(...matchingStoredEvents);

  // If we have stored events, prioritize them but still show defaults for November 2025
  // Only show default events if we're in November 2025 or later
  const isNovember2025 = year === 2025 && month === 11;
  const isDecember2025 = year === 2025 && month === 12;
  const isOctober2025 = year === 2025 && month === 10;

  if (!isNovember2025 && !isDecember2025 && !isOctober2025 && storedEvents.length > 0) {
    return events;
  }

  // NOVEMBER 2025 PROMOTIONS
  if (isNovember2025 || isDecember2025) {
    // TV1 HIGH-END LUCKY FREE BET – TABLE GAMES GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 20), createDate(2025, 11, 20))) {
      events.push({
        id: 'tv1-offer9',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 9: Thursday, November 20',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 21), createDate(2025, 11, 21))) {
      events.push({
        id: 'tv1-offer10',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 10: Friday, November 21',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 22), createDate(2025, 11, 26))) {
      events.push({
        id: 'tv1-offer11',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 11: Saturday, November 22 – Wednesday November 26',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 27), createDate(2025, 11, 27))) {
      events.push({
        id: 'tv1-offer12',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 12: Thursday, November 27',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 28), createDate(2025, 11, 28))) {
      events.push({
        id: 'tv1-offer13',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 13: Friday, November 28',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 29), createDate(2025, 12, 3))) {
      events.push({
        id: 'tv1-offer14',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 14: Saturday, November 29 – Wednesday Dec. 3',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 12, 4), createDate(2025, 12, 4))) {
      events.push({
        id: 'tv1-offer15',
        title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 15: Thursday, December 4',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }

    // TV2 MID-LEVEL LUCKY FREE BET
    if (isDateInRange(date, createDate(2025, 11, 17), createDate(2025, 11, 20))) {
      events.push({
        id: 'tv2-offer6',
        title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 6: Mon. Nov. 17 – Thu. Nov. 20',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 21), createDate(2025, 11, 23))) {
      events.push({
        id: 'tv2-offer7',
        title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 7: Fri. Nov. 21 – Sun. Nov. 23',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 24), createDate(2025, 11, 27))) {
      events.push({
        id: 'tv2-offer8',
        title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 8: Mon. Nov. 24 – Thu. Nov. 27',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 28), createDate(2025, 11, 30))) {
      events.push({
        id: 'tv2-offer9',
        title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 9: Fri. Nov. 28 – Sun. Nov. 30',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 12, 1), createDate(2025, 12, 4))) {
      events.push({
        id: 'tv2-offer10',
        title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 10: Mon. Dec.1 – Thu. Dec. 4',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'Valid once during the date range above.',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }

    // TV3 LOW-END TABLE GAMES FREE BET
    if (isDateInRange(date, createDate(2025, 11, 20), createDate(2025, 11, 22))) {
      events.push({
        id: 'tv3-offer6',
        title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 6: Thursday, November 20 – Saturday, November 22',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 23), createDate(2025, 11, 26))) {
      events.push({
        id: 'tv3-offer7',
        title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 7: Sunday, November 23 – Wednesday, November 26',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 27), createDate(2025, 11, 29))) {
      events.push({
        id: 'tv3-offer8',
        title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 8: Thursday, November 27 – Saturday, November 29',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }
    if (isDateInRange(date, createDate(2025, 11, 30), createDate(2025, 12, 3))) {
      events.push({
        id: 'tv3-offer9',
        title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
        category: 'Promo',
        description: 'OFFER 9: Sunday, November 30 – Wednesday, December 3',
        details: [
          '10am – 11:59pm @ Promotion Kiosk',
          'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
          'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
          'Amount awarded is based on play.',
          'Only eligible for Live table games.'
        ]
      });
    }

    // NEWSLETTER FREE SLOT PLAY GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 23), createDate(2025, 11, 29))) {
      events.push({
        id: 'newsletter-slot-play',
        title: 'Newsletter Free Slot Play Giveaway',
        category: 'Invited',
        description: 'Daily, Sunday, November 23rd – Saturday, November 29th, 2025',
        details: [
          '9am – 11:59pm @ Promotion Kiosk',
          'Invited guests can report to any Promotion Kiosk to swipe and receive their Free Slot Play offer.',
          'The amount of Free Slot Play is based on their level of play.'
        ]
      });
    }

    // WOODEN DINING CUTTING BOARD
    if (isDateInRange(date, createDate(2025, 11, 23), createDate(2025, 11, 23))) {
      events.push({
        id: 'wooden-cutting-board',
        title: 'Wooden Dining Cutting Board -OR- Free Slot Play Giveaway',
        category: 'Invited',
        description: 'Sunday, November 23rd, 2025',
        details: [
          '1pm – 7pm @ Level 2 Bally\'s Gift Redemption Area for the Gift option',
          '1pm – 10pm @ Promotion Kiosk for the Free Slot Play option',
          'Preference is selected on the day of the giveaway.',
          'The amount of Free Slot Play awarded is based on their level of play.'
        ]
      });
    }

    // SWIPE FOR A CHANCE-TO-WIN $10 – $1,000 FREE SLOT PLAY (Nov 23)
    if (isDateInRange(date, createDate(2025, 11, 23), createDate(2025, 11, 23))) {
      events.push({
        id: 'swipe-chance-1000-nov23',
        title: 'Swipe For A Chance-To-Win $10 – $1,000 Free Slot Play',
        category: 'Invited',
        description: 'Sunday, November 23rd, 2025',
        details: [
          '1pm – 7pm @ Promotion Kiosk',
          'Invited guests can swipe at any Kiosk for their chance to win $10 – $1,000 Free Slot Play.',
          'If a winner, the Free Slot Play prize won will automatically be loaded onto the guests\' Bally Rewards Card.'
        ]
      });
    }

    // NEW SWIPE FOR A CHANCE-TO-WIN $5 – $1,000 FREE SLOT PLAY (Nov 23)
    if (isDateInRange(date, createDate(2025, 11, 23), createDate(2025, 11, 23))) {
      events.push({
        id: 'swipe-chance-5-1000-nov23',
        title: 'NEW Swipe For A Chance-To-Win $5 – $1,000 Free Slot Play',
        category: 'Invited',
        description: 'Sunday, November 23rd, 2025',
        details: [
          '1pm – 7pm @ Promotion Kiosk',
          'Invited guests can swipe at any Kiosk for their chance to win $5 – $1,000 Free Slot Play.',
          'If a winner, the Free Slot Play prize won will automatically be loaded onto the guests\' Bally Rewards Card.'
        ]
      });
    }

    // BONUS MONDAY XTRA PLAY
    if (dayOfWeek === 1 && (day === 3 || day === 10 || day === 17 || day === 24) && month === 11 && year === 2025) {
      events.push({
        id: 'bonus-monday-xtra-play',
        title: 'Bonus Monday Xtra Play',
        category: 'Invited',
        description: 'Mondays: November 3rd, 10th, 17th, 24th & December 1st, 2025',
        details: [
          '10am – 10pm @ Promotion Kiosk',
          'Invited guests will receive a direct mail piece which will provide details about this promotion as well as instructions on how to redeem their Bonus Monday Xtra Play.',
          'The amount of Free Slot Play each guest will receive is based on their level of play.',
          'Free Slot Play will automatically be loaded onto the guests\' Bally Rewards Card after they swipe at Kiosk.',
          'Free Slot Play prizes will be valid for 12 hours from the point of issue.'
        ]
      });
    }
    if (dayOfWeek === 1 && day === 1 && month === 12 && year === 2025) {
      events.push({
        id: 'bonus-monday-xtra-play-dec1',
        title: 'Bonus Monday Xtra Play',
        category: 'Invited',
        description: 'Monday, December 1st, 2025',
        details: [
          '10am – 10pm @ Promotion Kiosk',
          'Invited guests will receive a direct mail piece which will provide details about this promotion as well as instructions on how to redeem their Bonus Monday Xtra Play.',
          'The amount of Free Slot Play each guest will receive is based on their level of play.',
          'Free Slot Play will automatically be loaded onto the guests\' Bally Rewards Card after they swipe at Kiosk.',
          'Free Slot Play prizes will be valid for 12 hours from the point of issue.'
        ]
      });
    }

    // 14 IN 1 FOOD CHOPPER
    if (isDateInRange(date, createDate(2025, 11, 25), createDate(2025, 11, 25))) {
      events.push({
        id: 'food-chopper',
        title: '14 In 1 Food Chopper -OR- Free Slot Play -OR- Free Bet Giveaway Contingency',
        category: 'Invited',
        description: 'Tuesday, November 25th, 2025',
        details: [
          '1pm – 7pm @ Level 2 Bally\'s Gift Redemption Area for the Gift (*s) option',
          '1pm – 10pm @ Promotion Kiosk for the Free Slot Play option',
          '10am – 11pm @ Level 1 Bally\'s Players Club for the Free Bet option',
          'Preference is selected on the day of the giveaway.',
          'The amount of Free Slot Play awarded is based on their level of play.',
          '*Invited Table Game patrons are not eligible for Free Slot Play.'
        ]
      });
    }

    // SWIPE FOR A CHANCE-TO-WIN $10 – $1,000 FREE SLOT PLAY (Nov 25)
    if (isDateInRange(date, createDate(2025, 11, 25), createDate(2025, 11, 25))) {
      events.push({
        id: 'swipe-chance-1000-nov25',
        title: 'Swipe For A Chance-To-Win $10 – $1,000 Free Slot Play',
        category: 'Invited',
        description: 'Tuesday, November 25th, 2025',
        details: [
          '1pm – 7pm @ Promotion Kiosk',
          'Invited guests can swipe at any Kiosk for their chance to win $10 – $1,000 Free Slot Play.',
          'If a winner, the Free Slot Play prize won will automatically be loaded onto the guests\' Bally Rewards Card.'
        ]
      });
    }

    // NEW SWIPE FOR A CHANCE-TO-WIN $5 – $1,000 FREE SLOT PLAY (Nov 25)
    if (isDateInRange(date, createDate(2025, 11, 25), createDate(2025, 11, 25))) {
      events.push({
        id: 'swipe-chance-5-1000-nov25',
        title: 'NEW! Swipe For A Chance-To-Win $5 – $1,000 Free Slot Play',
        category: 'Invited',
        description: 'Tuesday, November 25th, 2025',
        details: [
          '1pm – 7pm @ Promotion Kiosk',
          'Invited guests can swipe at any Kiosk for their chance to win $5 – $1,000 Free Slot Play.',
          'If a winner, the Free Slot Play prize won will automatically be loaded onto the guests\' Bally Rewards Card.'
        ]
      });
    }

    // VISA -OR- TEXAS ROADHOUSE -OR- MACYS -OR- FREE SLOT PLAY GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 26), createDate(2025, 11, 26))) {
      events.push({
        id: 'visa-texas-macys-slot',
        title: 'VISA -OR- Texas Roadhouse -OR- Macys -OR- Free Slot Play Giveaway',
        category: 'Invited',
        description: 'Wednesday, November 26th, 2025',
        details: [
          '1pm – 7pm @ Level 2 Bally\'s Gift Redemption Area for the Gift Card option',
          '1pm – 10pm @ Promotion Kiosk for the Free Slot Play option',
          'Preference is selected on the day of the giveaway.',
          '$25 or $50 gift card. Free Slot Play option is $20 or $40 for slot patrons only.',
          'The amount of the gift card and Free Slot Play awarded is based on their level of play.'
        ]
      });
    }

    // NEW! ASIAN PD VISA REWARDS CARD OR MACY'S GIFT CARD GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 27), createDate(2025, 11, 27))) {
      events.push({
        id: 'asian-pd-visa-macys',
        title: 'NEW! Asian PD VISA Rewards Card OR Macy\'s Gift Card Giveaway',
        category: 'Invited',
        description: 'Thursday, November 27th, 2025',
        details: [
          '5:30pm – 9:30pm @ Casino Expansion Area Adjacent Host Podium',
          'Exclusive event offered to guests who fit the pre-determined criteria with the aforementioned offer.',
          'Invited guests will be sent a direct mail invitation to receive a $100 VISA rewards card OR $100 Macy\'s gift card.'
        ],
        highlight: true
      });
    }

    // NEW! XTRA PLAY GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 27), createDate(2025, 11, 27))) {
      events.push({
        id: 'xtra-play-giveaway',
        title: 'NEW! Xtra Play Giveaway',
        category: 'Invited',
        description: 'Thursday, November 27th, 2025',
        details: [
          '10am – 10pm @ Promotion Kiosk',
          'Invited guests will receive a direct mail piece which will provide details about this promotion as well as instructions on how to redeem their Xtra Play.',
          'The amount of Free Slot Play each guest will receive is based on their level of play.',
          'Free Slot Play will automatically be loaded onto the guests\' Bally Rewards Card after they swipe at Kiosk.',
          'Free Slot Play prizes will be valid for 12 hours from the point of issue.'
        ]
      });
    }

    // VISA -OR- MACYS -OR- TEXAS ROADHOUSE -OR- FREE SLOT PLAY -OR-*FREE BET GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 28), createDate(2025, 11, 28))) {
      events.push({
        id: 'visa-macys-texas-slot-bet',
        title: 'VISA -OR- Macys -OR- Texas Roadhouse -OR- Free Slot Play -OR-*Free Bet Giveaway',
        category: 'Invited',
        description: 'Friday, November 28th, 2025',
        details: [
          '1pm – 7pm @ Level 2 Bally\'s Gift Redemption Area for the Gift Card option',
          '1pm – 10pm @ Promotion Kiosk for the Free Slot Play option',
          '10am – 11pm @ Level 1 Bally\'s Players Club for the Free Bet option',
          'Preference is selected on the day of the giveaway.',
          '$25 or $50 or $100 gift card options.',
          '$50 or $100 Free Bet option for table game patrons.',
          'The amount of the gift card and Free Slot Play awarded is based on their level of play.',
          '*Invited Table Game patrons are not eligible for Free Slot Play.'
        ]
      });
    }

    // NEW! PROVIDENCE COLLEGE WINNERS WHEEL DRAWING
    if (isDateInRange(date, createDate(2025, 11, 28), createDate(2025, 11, 28))) {
      events.push({
        id: 'providence-college-wheel',
        title: 'NEW! Providence College Winners Wheel Drawing',
        category: 'Open',
        description: 'Friday, November 28th, 2025',
        details: [
          '9pm Drawing @ Level 1 Players Club',
          'Attendees after every home PC Men\'s Basketball game at the AMP, may present their game ticket (i.e., virtual ticket on a smartphone, physical ticket) to receive entry into the scheduled drawings',
          'Players Club Representatives or above will validate the PC Basketball ticket from the AMP, according to the drawing schedule and corresponding home games, and present a drawing entry ticket that identifies the day and date/time of the drawing',
          'Participants must legibly print first name, last name and Rewards Card ID number and place in the drawing drum located at the Players Club.',
          'There will be five (5) total winners for this promotion, having 10 (ten) minutes to claim their prize.',
          'One redraw will occur for any of the five (5) contestants who did not claim or properly validate their identity.',
          'Those who have successfully claimed will spin the Winning Combination Winners Wheel containing fifty (50) prize slots. Prizes range from $250-$5,000 in cash, $50-$2,500 in free slot play and $50-$500 in retail brand gift cards.'
        ],
        meta: [
          { label: 'WHEN', value: '9pm Drawing' },
          { label: 'WHERE', value: 'Level 1 Players Club' }
        ]
      });
    }

    // VIP PICK 1 HIGH END OR MID TIER GIFT -OR- FREE SLOT PLAY OR *FREE BET GIVEAWAY
    if (isDateInRange(date, createDate(2025, 11, 29), createDate(2025, 11, 29))) {
      events.push({
        id: 'vip-pick1-gift',
        title: 'VIP Pick 1 High End OR Mid Tier Gift -OR- Free Slot Play OR *Free Bet Giveaway',
        category: 'Invited',
        description: 'Saturday, November 29th, 2025',
        details: [
          '1pm – 7pm @ Level 2 Bally\'s Gift Redemption Area for the Gift option',
          '1pm – 10pm @ Promotion Kiosk for the Free Slot Play option',
          '10am – 11pm @ Level 1 Bally\'s Players Club for the Free Bet option',
          'Preference is selected on the day of the giveaway.',
          'The amount of Free Slot Play awarded is based on their level of play.',
          '*Invited Table Game patrons are not eligible for Free Slot Play.'
        ]
      });
    }

    // ONGOING: Accelerate Your Dreams! Win a Car-Every-Saturday Spectacular!
    if (isDateInRange(date, createDate(2025, 10, 4), createDate(2025, 12, 27)) && dayOfWeek === 6) {
      events.push({
        id: 'accelerate-dreams-car',
        title: 'Accelerate Your Dreams! Win a Car-Every-Saturday Spectacular!',
        category: 'Open',
        description: 'Saturdays, October 4-December 27, 2025',
        details: [
          '*Slot Only Promotional Program',
          'Car Prize Schedule:',
          'OCTOBER: 2025 ACURA MDX',
          'NOVEMBER: 2025 FORD F-150 SUPERCREW 4X4',
          'DECEMBER: 2026 BMW X3',
          'Entry Earning Period: Friday, October 3 – Saturday, December 27',
          'Accelerated Entries: All Rewards Members qualify for accelerated entry earnings where for every one (1) point earned on the VLTs during the earning period, Rewards Members will receive ten (10) additional entries.',
          'Bonus Entry Criteria: Legend Members will be eligible to receive 50 bonus entries and Champion Members will be eligible to receive 100 bonus entries per drawing.',
          'Cash Drawing Times: 6:00 pm – 8:00 pm',
          'Prize Structure:',
          '6:00 pm (5) = $500 in Cash',
          '7:00 pm (5) = $500 in Cash',
          '8:00 pm (5) = $1,000 in Cash',
          'Total Cash: $10,000',
          'Grand Prize Envelope Game Drawing: 9:00 pm',
          'Grand Prize: Car or Cash Prize Option: $35,000'
        ],
        meta: [
          { label: 'WHEN', value: 'Cash Drawings: 6:00pm – 8:00pm, Grand Prize: 9:00pm' },
          { label: 'WHERE', value: '1st Level Players Club' }
        ],
        highlight: true
      });
    }
  }

  return events;
};

// Get all default promotions as AdminEvents for admin panel
export const getDefaultPromotions = (): AdminEvent[] => {
  const promotions: AdminEvent[] = [];

  // TV1 HIGH-END LUCKY FREE BET
  promotions.push({
    id: 'tv1-offer9',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 9: Thursday, November 20',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-20',
    endDate: '2025-11-20',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv1-offer10',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 10: Friday, November 21',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-21',
    endDate: '2025-11-21',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv1-offer11',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 11: Saturday, November 22 – Wednesday November 26',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-22',
    endDate: '2025-11-26',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv1-offer12',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 12: Thursday, November 27',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-27',
    endDate: '2025-11-27',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv1-offer13',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 13: Friday, November 28',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-28',
    endDate: '2025-11-28',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv1-offer14',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 14: Saturday, November 29 – Wednesday Dec. 3',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-29',
    endDate: '2025-12-03',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv1-offer15',
    title: 'TV1 High-End Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 15: Thursday, December 4',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-12-04',
    endDate: '2025-12-04',
    startTime: '10:00',
    endTime: '23:59'
  });

  // TV2 MID-LEVEL LUCKY FREE BET
  promotions.push({
    id: 'tv2-offer6',
    title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 6: Mon. Nov. 17 – Thu. Nov. 20',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-17',
    endDate: '2025-11-20',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv2-offer7',
    title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 7: Fri. Nov. 21 – Sun. Nov. 23',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-21',
    endDate: '2025-11-23',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv2-offer8',
    title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 8: Mon. Nov. 24 – Thu. Nov. 27',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-24',
    endDate: '2025-11-27',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv2-offer9',
    title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 9: Fri. Nov. 28 – Sun. Nov. 30',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-28',
    endDate: '2025-11-30',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv2-offer10',
    title: 'TV2 Mid-Level Lucky Free Bet – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 10: Mon. Dec.1 – Thu. Dec. 4',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'Valid once during the date range above.',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-12-01',
    endDate: '2025-12-04',
    startTime: '10:00',
    endTime: '23:59'
  });

  // TV3 LOW-END TABLE GAMES FREE BET
  promotions.push({
    id: 'tv3-offer6',
    title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 6: Thursday, November 20 – Saturday, November 22',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-20',
    endDate: '2025-11-22',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv3-offer7',
    title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 7: Sunday, November 23 – Wednesday, November 26',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-23',
    endDate: '2025-11-26',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv3-offer8',
    title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 8: Thursday, November 27 – Saturday, November 29',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-27',
    endDate: '2025-11-29',
    startTime: '10:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'tv3-offer9',
    title: 'TV3 Low-End Table Games Free Bet Offer – Table Games Giveaway',
    category: 'Promo',
    description: 'OFFER 9: Sunday, November 30 – Wednesday, December 3',
    details: [
      '10am – 11:59pm @ Promotion Kiosk',
      'May be redeemed once during the following bi-weekly periods (or 2 offers per week).',
      'Pick up Free Bet vouchers @ Level 1 Bally\'s Players Club after swiping from the Kiosk.',
      'Amount awarded is based on play.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-11-30',
    endDate: '2025-12-03',
    startTime: '10:00',
    endTime: '23:59'
  });

  // Add more key promotions - Newsletter, special events, etc.
  promotions.push({
    id: 'newsletter-slot-play',
    title: 'Newsletter Free Slot Play Giveaway',
    category: 'Invited',
    description: 'Daily, Sunday, November 23rd – Saturday, November 29th, 2025',
    details: [
      '9am – 11:59pm @ Promotion Kiosk',
      'Invited guests can report to any Promotion Kiosk to swipe and receive their Free Slot Play offer.',
      'The amount of Free Slot Play is based on their level of play.'
    ],
    startDate: '2025-11-23',
    endDate: '2025-11-29',
    startTime: '09:00',
    endTime: '23:59'
  });

  promotions.push({
    id: 'wooden-cutting-board',
    title: 'Wooden Dining Cutting Board -OR- Free Slot Play Giveaway',
    category: 'Invited',
    description: 'Sunday, November 23rd, 2025',
    details: [
      '1pm – 7pm @ Level 2 Bally\'s Gift Redemption Area for the Gift option',
      '1pm – 10pm @ Promotion Kiosk for the Free Slot Play option',
      'Preference is selected on the day of the giveaway.',
      'The amount of Free Slot Play awarded is based on their level of play.'
    ],
    startDate: '2025-11-23',
    endDate: '2025-11-23',
    startTime: '13:00',
    endTime: '22:00'
  });

  // Add Accelerate Your Dreams (recurring Saturday)
  promotions.push({
    id: 'accelerate-dreams-car',
    title: 'Accelerate Your Dreams! Win a Car-Every-Saturday Spectacular!',
    category: 'Open',
    description: 'Saturdays, October 4-December 27, 2025',
    details: [
      '*Slot Only Promotional Program',
      'Car Prize Schedule:',
      'OCTOBER: 2025 ACURA MDX',
      'NOVEMBER: 2025 FORD F-150 SUPERCREW 4X4',
      'DECEMBER: 2026 BMW X3',
      'Entry Earning Period: Friday, October 3 – Saturday, December 27',
      'Accelerated Entries: All Rewards Members qualify for accelerated entry earnings where for every one (1) point earned on the VLTs during the earning period, Rewards Members will receive ten (10) additional entries.',
      'Bonus Entry Criteria: Legend Members will be eligible to receive 50 bonus entries and Champion Members will be eligible to receive 100 bonus entries per drawing.',
      'Cash Drawing Times: 6:00 pm – 8:00 pm',
      'Prize Structure:',
      '6:00 pm (5) = $500 in Cash',
      '7:00 pm (5) = $500 in Cash',
      '8:00 pm (5) = $1,000 in Cash',
      'Total Cash: $10,000',
      'Grand Prize Envelope Game Drawing: 9:00 pm',
      'Grand Prize: Car or Cash Prize Option: $35,000'
    ],
    meta: [
      { label: 'WHEN', value: 'Cash Drawings: 6:00pm – 8:00pm, Grand Prize: 9:00pm' },
      { label: 'WHERE', value: '1st Level Players Club' }
    ],
    highlight: true,
    startDate: '2025-10-04',
    endDate: '2025-12-27',
    isRecurring: true,
    daysOfWeek: [6], // Saturday
    startTime: '18:00',
    endTime: '21:00'
  });

  return promotions;
};
