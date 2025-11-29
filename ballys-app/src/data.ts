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
  property?: 'Lincoln' | 'Tiverton' | 'Both';
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

export const getEventsForDate = (date: Date): Event[] => {
  const events: Event[] = [];
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12

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

  return events;
};

// Get all default promotions as AdminEvents for admin panel
export const getDefaultPromotions = (): AdminEvent[] => {
  const promotions: AdminEvent[] = [];

  // Princess / Holland America / Carnival Cruise Giveaway
  promotions.push({
    id: 'cruise-giveaway-dec5',
    title: 'Princess / Holland America / Carnival Cruise Giveaway',
    category: 'Invited',
    description: 'Friday, December 5 OR Saturday, December 6',
    details: [
      '8a-10p @ Promotion Kiosk',
      'Invited Bally Rewards members will receive a certificate for a complimentary Princess / Holland America / Carnival Cruise for two.',
      'Must swipe Bally Rewards Card at a promotion kiosk to redeem.',
      'Cruise certificates mailed within 21 business days.',
      'Offer redeemed only once between the two Rhode Island properties.'
    ],
    startDate: '2025-12-05',
    endDate: '2025-12-06',
    startTime: '08:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // 2nd Chance Cruise Giveaway
  promotions.push({
    id: 'cruise-giveaway-2nd-chance',
    title: '2nd Chance: Princess / Holland America / Carnival Cruise Giveaway',
    category: 'Invited',
    description: 'Saturday, December 27',
    details: [
      '8a-10p @ Promotion Kiosk',
      'For invited members who did not redeem on Dec 5 or 6.',
      'Must swipe Bally Rewards Card at a promotion kiosk to redeem.',
      'Cruise certificates mailed within 21 business days.'
    ],
    startDate: '2025-12-27',
    endDate: '2025-12-27',
    startTime: '08:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // $15,000 Blackjack Tournament - Qualifying
  promotions.push({
    id: 'blackjack-qualifying',
    title: '$15,000 Blackjack Tournament - Qualifying Round',
    category: 'Promo',
    description: 'Friday, December 5',
    details: [
      '6p-11p',
      'Top 10 participants advance to Quarter Finals on Dec 12.'
    ],
    startDate: '2025-12-05',
    endDate: '2025-12-05',
    startTime: '18:00',
    endTime: '23:00',
    property: 'Tiverton'
  });

  // $15,000 Blackjack Tournament - Grand Prize
  promotions.push({
    id: 'blackjack-grand-prize',
    title: '$15,000 Blackjack Tournament - Grand Prize',
    category: 'Promo',
    description: 'Friday, December 12',
    details: [
      'Registration: 5:30p @ Bally Rewards Center',
      'Quarter Final Rounds: 6p - 8:30p',
      'Semi-Final Rounds: 9p - 10p',
      'Final Round: 10:30p',
      '1st Place: $6,000 CASH',
      '2nd Place: $2,500 Free Bets',
      '3rd Place: $1,000 Free Bets',
      '4th-6th Place: $500 Free Bets'
    ],
    startDate: '2025-12-12',
    endDate: '2025-12-12',
    startTime: '17:30',
    endTime: '23:00',
    property: 'Tiverton'
  });

  // Champions Event
  promotions.push({
    id: 'champions-event',
    title: 'Champions Event',
    category: 'Invited',
    description: 'Saturday, December 13',
    details: [
      '1p – 9p',
      'Invited CHAMPIONS Rewards Card members receive a retail brand gift card & dining invitation.',
      'Gift Card Redemption: Bally Rewards Center',
      'Free Slot Play Redemption: Promotions Kiosk',
      'Free Bet Redemption: Bally Rewards Center'
    ],
    startDate: '2025-12-13',
    endDate: '2025-12-13',
    startTime: '13:00',
    endTime: '21:00',
    property: 'Tiverton'
  });

  // 15k Holiday Free Slot Play Sweepstakes
  promotions.push({
    id: 'holiday-sweepstakes',
    title: '15k Holiday Free Slot Play Sweepstakes',
    category: 'Promo',
    description: 'Friday, December 19',
    details: [
      '5p-9p: 2 winners @ $1,500 Free Slot Play (hourly)',
      'Earning Period: 3p-8:59p (Swipe or use card at VLT)',
      '1 entry for every 10 points earned on VLTs.',
      'Must be present to win. Claim within 10 mins.'
    ],
    startDate: '2025-12-19',
    endDate: '2025-12-19',
    startTime: '17:00',
    endTime: '21:00',
    property: 'Tiverton'
  });

  // $20,260 Countdown to 2026 Sweepstakes
  promotions.push({
    id: 'countdown-2026-sweepstakes',
    title: '$20,260 Countdown to 2026 Sweepstakes',
    category: 'Promo',
    description: 'Wednesday, December 31',
    details: [
      '5p-9p: 2 winners @ $2,026 Free Slot Play (hourly)',
      'Earning Period: 3p-8:59p (Swipe or use card at VLT)',
      '1 entry for every 10 points earned on VLTs.',
      'Must be present to win.'
    ],
    startDate: '2025-12-31',
    endDate: '2025-12-31',
    startTime: '17:00',
    endTime: '21:00',
    property: 'Tiverton'
  });

  // $5,000 Bonus Slot Tournaments
  promotions.push({
    id: 'bonus-slot-tournaments',
    title: '$5,000 Bonus Slot Tournaments (EBS @ VLTs)',
    category: 'Promo',
    description: 'Tuesdays in December',
    details: [
      '12p-8p',
      '1st Place: $1,000 | 2nd: $500 | 3rd-6th: $250',
      'All prizes awarded in Free Slot Play.',
      'Valid for 7 days.'
    ],
    daysOfWeek: [2], // Tuesday
    isRecurring: true,
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    startTime: '12:00',
    endTime: '20:00',
    property: 'Tiverton'
  });

  // SUPER Xtra Play
  promotions.push({
    id: 'super-xtra-play',
    title: 'SUPER Xtra Play (EBS @ VLTs)',
    category: 'Promo',
    description: 'Wednesday, Dec 24 & Thursday, Dec 25',
    details: [
      '10a-10p',
      'Insert card and press "TiverSpin" at eligible VLT.',
      'Win up to $1,000 in Free Slot Play (valid 24 hours).'
    ],
    startDate: '2025-12-24',
    endDate: '2025-12-25',
    startTime: '10:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // Xtra Play - Wednesdays (Dec 3)
  promotions.push({
    id: 'xtra-play-wed-dec3',
    title: 'Xtra Play (EBS @ VLTs)',
    category: 'Promo',
    description: 'Wednesday, December 3',
    details: [
      '10a-10p',
      'Win up to $1,000 in Free Slot Play.'
    ],
    startDate: '2025-12-03',
    endDate: '2025-12-03',
    startTime: '10:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // Xtra Play - Wednesdays (Dec 17)
  promotions.push({
    id: 'xtra-play-wed-dec17',
    title: 'Xtra Play (EBS @ VLTs)',
    category: 'Promo',
    description: 'Wednesday, December 17',
    details: [
      '10a-10p',
      'Win up to $1,000 in Free Slot Play.'
    ],
    startDate: '2025-12-17',
    endDate: '2025-12-17',
    startTime: '10:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // Xtra Play - Thursdays
  promotions.push({
    id: 'xtra-play-thu',
    title: 'Xtra Play (EBS @ VLTs)',
    category: 'Promo',
    description: 'Thursdays (Dec 4, 11, 18)',
    details: [
      '10a-10p',
      'Win up to $1,000 in Free Slot Play.'
    ],
    startDate: '2025-12-04',
    endDate: '2025-12-18',
    daysOfWeek: [4],
    isRecurring: true,
    startTime: '10:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // Xtra Play - Saturdays
  promotions.push({
    id: 'xtra-play-sat',
    title: 'Xtra Play (EBS @ VLTs)',
    category: 'Promo',
    description: 'Saturdays',
    details: [
      '8a-10p',
      'Win up to $1,000 in Free Slot Play.'
    ],
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    daysOfWeek: [6],
    isRecurring: true,
    startTime: '08:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // Swipe for Gift Card (Dec 3)
  promotions.push({
    id: 'swipe-gift-card-dec3',
    title: 'Swipe for a Chance to Win a $10-$100 Gift Card',
    category: 'Promo',
    description: 'Wednesday, December 3',
    details: [
      '1p-7p @ Promotions Kiosk',
      'Chance to win $10-$100 retail brand gift card.',
      'Claim at Bally Rewards Center.'
    ],
    startDate: '2025-12-03',
    endDate: '2025-12-03',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Tiverton'
  });

  // Swipe for Gift Card (Dec 17)
  promotions.push({
    id: 'swipe-gift-card-dec17',
    title: 'Swipe for a Chance to Win a $10-$100 Gift Card',
    category: 'Promo',
    description: 'Wednesday, December 17',
    details: [
      '1p-7p @ Promotions Kiosk',
      'Chance to win $10-$100 retail brand gift card.',
      'Claim at Bally Rewards Center.'
    ],
    startDate: '2025-12-17',
    endDate: '2025-12-17',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Tiverton'
  });

  // $100 Gift Card OR Free Slot Play
  promotions.push({
    id: 'gift-card-or-slot-play',
    title: '$100 Retail Gift Card OR $100 Free Slot Play',
    category: 'Promo',
    description: 'Saturday, Dec 20 & Friday, Dec 26',
    details: [
      '1p-7p',
      'Gift Card @ Bally Rewards Center | Free Slot Play @ Promotion Kiosk',
      'Choose between $100 gift card or $100 Free Slot Play.'
    ],
    startDate: '2025-12-20',
    endDate: '2025-12-26',
    daysOfWeek: [5, 6],
    isRecurring: true,
    startTime: '13:00',
    endTime: '19:00',
    property: 'Tiverton'
  });

  // $100 Gift Card OR Lucky Free Bet
  promotions.push({
    id: 'gift-card-or-free-bet',
    title: '$100 Retail Gift Card OR $100 Lucky Free Bet',
    category: 'Promo',
    description: 'Saturday, Dec 20 & Friday, Dec 26',
    details: [
      'Gift Card: 1p-7p @ Bally Rewards Center',
      'Lucky Free Bet: 1p-10p @ Bally Rewards Center',
      'Choose between $100 gift card or $100 Lucky Free Bets.'
    ],
    startDate: '2025-12-20',
    endDate: '2025-12-26',
    daysOfWeek: [5, 6],
    isRecurring: true,
    startTime: '13:00',
    endTime: '22:00',
    property: 'Tiverton'
  });

  // Choice of Gift Card or Free Slot Play
  promotions.push({
    id: 'choice-gift-card-slot-play',
    title: 'Choice of Retail Gift Card OR Free Slot Play',
    category: 'Promo',
    description: 'Wednesday, December 10',
    details: [
      '1p-7p',
      'Gift Card @ Bally Rewards Center | Free Slot Play @ Promotion Kiosk'
    ],
    startDate: '2025-12-10',
    endDate: '2025-12-10',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Tiverton'
  });

  // Swipe for $20 Gift Card
  promotions.push({
    id: 'swipe-20-gift-card',
    title: 'Swipe for a Chance to Win a $20 Gift Card',
    category: 'Promo',
    description: 'Wednesday, December 10',
    details: [
      '1p-7p @ Promotions Kiosk',
      'Chance to win $20 retail brand gift card.'
    ],
    startDate: '2025-12-10',
    endDate: '2025-12-10',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Tiverton'
  });

  // Lucky Free Bet - Table Games (Daily)
  promotions.push({
    id: 'lucky-free-bet-daily',
    title: 'Lucky Free Bet – Table Games',
    category: 'Promo',
    description: 'Daily',
    details: [
      '10a-10p @ Promotion Kiosk',
      'Swipe to reveal Lucky Free Bets offer.',
      'Redeem at Bally Rewards Center same day.'
    ],
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    isRecurring: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: '10:00',
    endTime: '22:00',
    property: 'Both'
  });

  // Match Your New England Slot Offer
  promotions.push({
    id: 'match-slot-offer',
    title: 'Match Your New England Slot Offer',
    category: 'Promo',
    description: 'Sunday – Saturday',
    details: [
      '10a-10p @ Bally Rewards Center',
      'Once every Sunday–Saturday',
      'New members or 13+ months inactive eligible.',
      'Match base Free Slot Play offers up to $500.'
    ],
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    isRecurring: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startTime: '10:00',
    endTime: '22:00',
    property: 'Both'
  });

  // Entertainment - DJ (Fridays)
  promotions.push({
    id: 'entertainment-dj-fri',
    title: 'DJ',
    category: 'Entertainment',
    description: 'Fridays',
    details: ['8:30p'],
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    isRecurring: true,
    daysOfWeek: [5], // Friday
    startTime: '20:30',
    endTime: '23:59',
    property: 'Both'
  });

  // Entertainment - DJ (New Year's Eve)
  promotions.push({
    id: 'entertainment-dj-nye',
    title: 'DJ',
    category: 'Entertainment',
    description: 'Wednesday, December 31',
    details: ['8:30p'],
    startDate: '2025-12-31',
    endDate: '2025-12-31',
    startTime: '20:30',
    endTime: '23:59',
    property: 'Both'
  });

  // Entertainment - Live Acts
  promotions.push({
    id: 'entertainment-matt-browne',
    title: 'Live Act: Matt Browne',
    category: 'Entertainment',
    description: 'Saturday, December 6',
    details: ['8:30p'],
    startDate: '2025-12-06',
    endDate: '2025-12-06',
    startTime: '20:30',
    endTime: '23:59',
    property: 'Tiverton'
  });

  promotions.push({
    id: 'entertainment-blake-gorman',
    title: 'Live Act: Blake Gorman',
    category: 'Entertainment',
    description: 'Saturday, December 13',
    details: ['8:30p'],
    startDate: '2025-12-13',
    endDate: '2025-12-13',
    startTime: '20:30',
    endTime: '23:59',
    property: 'Tiverton'
  });

  promotions.push({
    id: 'entertainment-gary-labossiere',
    title: 'Live Act: Gary Labossiere',
    category: 'Entertainment',
    description: 'Saturday, December 20',
    details: ['8:30p'],
    startDate: '2025-12-20',
    endDate: '2025-12-20',
    startTime: '20:30',
    endTime: '23:59',
    property: 'Tiverton'
  });

  promotions.push({
    id: 'entertainment-kickin-it',
    title: 'Live Act: Kickin’ It Acoustic',
    category: 'Entertainment',
    description: 'Saturday, December 27',
    details: ['8:30p'],
    startDate: '2025-12-27',
    endDate: '2025-12-27',
    startTime: '20:30',
    endTime: '23:59',
    property: 'Tiverton'
  });

  // BALLY'S LINCOLN EVENTS

  // TV1 High-End Lucky Free Bet
  promotions.push({
    id: 'lincoln-tv1-free-bet',
    title: 'High-End Lucky Free Bet – Table Games',
    category: 'Invited',
    description: 'TV1: Multiple Offers in December',
    details: [
      '10a-11:59p @ Promotion Kiosk',
      'Offers available throughout Dec 5 - Jan 1',
      'Pick up voucher at Level 1 Players Club after swiping.',
      'Only eligible for Live table games.'
    ],
    startDate: '2025-12-05',
    endDate: '2025-12-31', // Covering the core period
    startTime: '10:00',
    endTime: '23:59',
    property: 'Lincoln',
    isRecurring: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  });

  // TV2 Mid-Level Lucky Free Bet
  promotions.push({
    id: 'lincoln-tv2-free-bet',
    title: 'Mid-Level Lucky Free Bet – Table Games',
    category: 'Invited',
    description: 'TV2: Multiple Offers in December',
    details: [
      '10a-11:59p @ Promotion Kiosk',
      'Offers available throughout Dec 5 - Jan 1',
      'Pick up voucher at Level 1 Players Club after swiping.'
    ],
    startDate: '2025-12-05',
    endDate: '2025-12-31',
    startTime: '10:00',
    endTime: '23:59',
    property: 'Lincoln',
    isRecurring: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  });

  // TV3 Low-End Lucky Free Bet
  promotions.push({
    id: 'lincoln-tv3-free-bet',
    title: 'Low-End Lucky Free Bet – Table Games',
    category: 'Invited',
    description: 'TV3: Bi-Weekly Offers',
    details: [
      '10a-11:59p @ Promotion Kiosk',
      'Redeem once during bi-weekly periods (or 2 offers per week).',
      'Pick up voucher at Level 1 Players Club.'
    ],
    startDate: '2025-12-04',
    endDate: '2025-12-31',
    startTime: '10:00',
    endTime: '23:59',
    property: 'Lincoln',
    isRecurring: true,
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
  });

  // Newsletter Free Slot Play (Lincoln)
  promotions.push({
    id: 'lincoln-newsletter-slot-play',
    title: 'Newsletter Free Slot Play Giveaway',
    category: 'Invited',
    description: 'Daily, Nov 30 – Dec 6',
    details: [
      '9a-11:59p @ Promotion Kiosk',
      'Swipe to receive Free Slot Play offer based on play.'
    ],
    startDate: '2025-11-30',
    endDate: '2025-12-06',
    startTime: '09:00',
    endTime: '23:59',
    property: 'Lincoln'
  });

  // Heated Boot & Shoe Dryer OR Free Slot Play
  promotions.push({
    id: 'lincoln-boot-dryer',
    title: 'Heated Boot & Shoe Dryer OR Free Slot Play',
    category: 'Invited',
    description: 'Sunday, Nov 30',
    details: [
      'Gift: 1p-7p @ Level 2 Gift Redemption Area',
      'Free Slot Play: 1p-10p @ Promotion Kiosk',
      'Preference selected day of giveaway.'
    ],
    startDate: '2025-11-30',
    endDate: '2025-11-30',
    startTime: '13:00',
    endTime: '22:00',
    property: 'Lincoln'
  });

  // Swipe for Chance to Win (Nov 30 - Lincoln)
  promotions.push({
    id: 'lincoln-swipe-win-nov30',
    title: 'Swipe for a Chance to Win Free Slot Play',
    category: 'Promo',
    description: 'Sunday, Nov 30',
    details: [
      '1p-7p @ Promotion Kiosk',
      'Chance to win $10-$1,000 or $5-$1,000 Free Slot Play.'
    ],
    startDate: '2025-11-30',
    endDate: '2025-11-30',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Lincoln'
  });

  // Bonus Monday Xtra Play (Lincoln)
  promotions.push({
    id: 'lincoln-bonus-monday',
    title: 'Bonus Monday Xtra Play',
    category: 'Invited',
    description: 'Mondays: Nov 3-24 & Dec 1',
    details: [
      '10a-10p @ Promotion Kiosk',
      'Free Slot Play based on level of play.',
      'Valid for 12 hours.'
    ],
    startDate: '2025-11-03',
    endDate: '2025-12-01',
    isRecurring: true,
    daysOfWeek: [1], // Monday
    startTime: '10:00',
    endTime: '22:00',
    property: 'Lincoln'
  });

  // Retro Games Station / Free Slot Play / Free Bet (Dec 2)
  promotions.push({
    id: 'lincoln-retro-games-dec2',
    title: 'Retro Games Station OR Free Slot Play OR Free Bet',
    category: 'Invited',
    description: 'Tuesday, Dec 2',
    details: [
      'Gift: 1p-7p @ Level 2 Gift Redemption',
      'Free Slot Play: 1p-10p @ Kiosk',
      'Free Bet: 10a-11p @ Level 1 Players Club'
    ],
    startDate: '2025-12-02',
    endDate: '2025-12-02',
    startTime: '10:00',
    endTime: '23:00',
    property: 'Lincoln'
  });

  // Swipe for Chance to Win (Dec 2 - Lincoln)
  promotions.push({
    id: 'lincoln-swipe-win-dec2',
    title: 'Swipe for a Chance to Win Free Slot Play',
    category: 'Promo',
    description: 'Tuesday, Dec 2',
    details: [
      '1p-7p @ Promotion Kiosk',
      'Chance to win $10-$1,000 or $5-$1,000 Free Slot Play.'
    ],
    startDate: '2025-12-02',
    endDate: '2025-12-02',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Lincoln'
  });

  // Stop & Shop / TJ Maxx / Texas Roadhouse / Macy's / Free Slot Play (Dec 3)
  promotions.push({
    id: 'lincoln-gift-card-dec3',
    title: 'Gift Card OR Free Slot Play Giveaway',
    category: 'Invited',
    description: 'Wednesday, Dec 3',
    details: [
      'Gift Card: 1p-7p @ Level 2 Gift Redemption ($25 or $50)',
      'Free Slot Play: 1p-10p @ Kiosk ($20 or $40)',
      'Stop & Shop, TJ Maxx, Texas Roadhouse, Macy\'s options.'
    ],
    startDate: '2025-12-03',
    endDate: '2025-12-03',
    startTime: '13:00',
    endTime: '22:00',
    property: 'Lincoln'
  });

  // Weighted Blanket OR Free Slot Play (Dec 4)
  promotions.push({
    id: 'lincoln-weighted-blanket-dec4',
    title: 'Weighted Blanket OR Free Slot Play',
    category: 'Invited',
    description: 'Thursday, Dec 4',
    details: [
      'Gift: 1p-7p @ Level 2 Gift Redemption',
      'Free Slot Play: 1p-10p @ Kiosk'
    ],
    startDate: '2025-12-04',
    endDate: '2025-12-04',
    startTime: '13:00',
    endTime: '22:00',
    property: 'Lincoln'
  });

  // Swipe for Chance to Win (Dec 4 - Lincoln)
  promotions.push({
    id: 'lincoln-swipe-win-dec4',
    title: 'Swipe for a Chance to Win Free Slot Play',
    category: 'Promo',
    description: 'Thursday, Dec 4',
    details: [
      '1p-7p @ Promotion Kiosk',
      'Chance to win $10-$1,000 or $5-$1,000 Free Slot Play.'
    ],
    startDate: '2025-12-04',
    endDate: '2025-12-04',
    startTime: '13:00',
    endTime: '19:00',
    property: 'Lincoln'
  });

  // Home Depot / Gift Cards / Free Slot Play / Free Bet (Dec 5)
  promotions.push({
    id: 'lincoln-home-depot-dec5',
    title: 'Home Depot / Gift Card / Free Play / Free Bet',
    category: 'Invited',
    description: 'Friday, Dec 5',
    details: [
      'Gift Card: 1p-7p @ Level 2 Gift Redemption ($25/$50/$100)',
      'Free Slot Play: 1p-10p @ Kiosk',
      'Free Bet: 10a-11p @ Level 1 Players Club ($50/$100)'
    ],
    startDate: '2025-12-05',
    endDate: '2025-12-05',
    startTime: '10:00',
    endTime: '23:00',
    property: 'Lincoln'
  });

  // Champions & Legends Shopping Event (Dec 6)
  promotions.push({
    id: 'lincoln-champions-shopping-dec6',
    title: 'Champions & Legends Shopping Event',
    category: 'Invited',
    description: 'Saturday, Dec 6',
    details: [
      'Gift: 1p-7p @ Event Center Pre-Function Area',
      'Free Slot Play: 1p-10p @ Kiosk',
      'Free Bet: 1p-10p @ Level 1 Players Club'
    ],
    startDate: '2025-12-06',
    endDate: '2025-12-06',
    startTime: '13:00',
    endTime: '22:00',
    property: 'Lincoln'
  });

  // Win a Car-Every-Saturday Spectacular
  promotions.push({
    id: 'lincoln-car-saturday',
    title: 'Win a Car-Every-Saturday Spectacular!',
    category: 'Promo',
    description: 'Saturdays in December',
    details: [
      'Cash Drawings: 6p-8p ($10,000 Total)',
      'Grand Prize Envelope Game: 9p (Win 2026 BMW X3 or $35,000)',
      'Entry Earning: Oct 3 - Dec 27',
      'Prize Redemption: 1st Level Players Club'
    ],
    startDate: '2025-12-01',
    endDate: '2025-12-31',
    isRecurring: true,
    daysOfWeek: [6], // Saturday
    startTime: '18:00',
    endTime: '22:00',
    property: 'Lincoln'
  });

  return promotions;
};
