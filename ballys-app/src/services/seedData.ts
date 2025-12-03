import type { MailJob } from './dropSheetService';

// Helper to parse the provided JSON structure
// The user provided: [ { property, year, month, jobs: [...] }, ... ]
const HISTORICAL_PAYLOAD = [
  {
    "property": "Lincoln",
    "year": 2025,
    "month": "December",
    "jobs": [
      {
        "campaign_name": "December Slot Core Bklt - 12 pg",
        "mail_type": "Core/Newsletter",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 44801,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-01",
        "milestones": {
          "outline_given": "2025-10-13",
          "data_received": "2025-11-07 15:43:44",
          "data_approved": "2025-11-17 12:29:55",
          "creative_received": "2025-11-07 13:28:45",
          "creative_approved": "2025-11-17 12:29:54",
          "mailed_on": "2025-11-17"
        }
      },
      {
        "campaign_name": "December Slot Core Bklt - 8 pg",
        "mail_type": "Core/Newsletter",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 15585,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-01",
        "milestones": {
          "outline_given": "2025-10-13",
          "data_received": "2025-11-07 15:43:44",
          "data_approved": "2025-11-18 10:57:50",
          "creative_received": "2025-11-07 13:28:45",
          "creative_approved": "2025-11-18 10:57:50",
          "mailed_on": "2025-11-17"
        }
      },
      {
        "campaign_name": "Bally's Lincoln December Lucky Free Bet Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 6265,
        "in_home_date": "2025-11-21",
        "valid_start_date": "2025-12-05",
        "milestones": {
          "outline_given": "2025-10-28",
          "data_received": "2025-11-07 15:52:32",
          "data_approved": "2025-11-18 14:09:07",
          "creative_received": "2025-11-16 12:01:57",
          "creative_approved": "2025-11-18 14:09:06",
          "mailed_on": "2025-11-18"
        }
      },
      {
        "campaign_name": "Bally's Lincoln Champions Event Slots Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "First Class",
        "quantity": 364,
        "in_home_date": "2025-11-24",
        "valid_start_date": "2025-12-06",
        "milestones": {
          "outline_given": "2025-11-04",
          "data_received": "2025-11-13 16:09:02",
          "data_approved": "2025-11-18 16:35:43",
          "creative_received": "2025-11-13 10:06:04",
          "creative_approved": "2025-11-18 16:35:43",
          "mailed_on": "2025-11-21"
        }
      },
      {
        "campaign_name": "Bally's Lincoln Champions Event Tables Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "First Class",
        "quantity": 156,
        "in_home_date": "2025-11-24",
        "valid_start_date": "2025-12-06",
        "milestones": {
          "outline_given": "2025-11-04",
          "data_received": "2025-11-13 16:09:02",
          "data_approved": "2025-11-18 16:44:48",
          "creative_received": "2025-11-13 09:42:04",
          "creative_approved": "2025-11-18 16:44:48",
          "mailed_on": "2025-11-21"
        }
      },
      {
        "campaign_name": "Bally's Lincoln Legends Event Tables Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "First Class",
        "quantity": 790,
        "in_home_date": "2025-11-24",
        "valid_start_date": "2025-12-06",
        "milestones": {
          "outline_given": "2025-11-04",
          "data_received": "2025-11-13 16:09:02",
          "data_approved": "2025-11-18 17:45:06",
          "creative_received": "2025-11-13 09:42:04",
          "creative_approved": "2025-11-18 17:45:05",
          "mailed_on": "2025-11-21"
        }
      },
      {
        "campaign_name": "Bally's Lincoln Legends Event Slots Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 2093,
        "in_home_date": "2025-11-24",
        "valid_start_date": "2025-12-06",
        "milestones": {
          "outline_given": "2025-11-04",
          "data_received": "2025-11-13 16:09:02",
          "data_approved": "2025-11-18 17:41:28",
          "creative_received": "2025-11-13 09:42:04",
          "creative_approved": "2025-11-18 17:41:28",
          "mailed_on": "2025-11-21"
        }
      },
      {
        "campaign_name": "Bally's Lincoln December Lucky Free Bet Selfmailer - 3 panel",
        "mail_type": "Tri-Fold",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 4376,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-01",
        "milestones": {
          "outline_given": "2025-10-28",
          "data_received": "2025-11-07 15:52:32",
          "data_approved": "2025-11-18 14:08:32",
          "creative_received": "2025-11-07 13:35:33",
          "creative_approved": "2025-11-18 14:08:32",
          "mailed_on": "2025-11-18"
        }
      },
      {
        "campaign_name": "Bally's Lincoln December Lucky Free Bet Selfmailer - 2 Panel",
        "mail_type": "Bi-Fold",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 8960,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-01",
        "milestones": {
          "outline_given": "2025-10-28",
          "data_received": "2025-11-07 15:52:32",
          "data_approved": "2025-11-18 14:08:27",
          "creative_received": "2025-11-16 12:02:09",
          "creative_approved": "2025-11-18 14:08:26",
          "mailed_on": "2025-11-18"
        }
      },
      {
        "campaign_name": "Bally's Lincoln 12/11 PD VIP Host Dinner Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 6847,
        "in_home_date": "2025-11-24",
        "valid_start_date": "2025-12-08",
        "milestones": {
          "outline_given": "2025-11-04",
          "data_received": "2025-11-13 15:31:33",
          "data_approved": "2025-11-18 14:16:32",
          "creative_received": "2025-11-12 10:39:35",
          "creative_approved": "2025-11-18 14:16:32",
          "mailed_on": "2025-11-21"
        }
      },
      {
        "campaign_name": "Bally's Lincoln New Years Eve Invite",
        "mail_type": "6x9 Postcard",
        "job_submitted": false,
        "postage": "Standard",
        "quantity": 0,
        "in_home_date": "2025-12-01",
        "valid_start_date": "2025-12-15",
        "milestones": {
          "outline_given": null,
          "data_received": null,
          "data_approved": null,
          "creative_received": null,
          "creative_approved": null,
          "mailed_on": "2025-11-25"
        }
      },
      {
        "campaign_name": "Bally's Lincoln FIRST Chance Carnival/Princess/Holland Cruise",
        "mail_type": "6x9 Postcard",
        "job_submitted": false,
        "postage": "Standard",
        "quantity": 0,
        "in_home_date": "2025-11-07",
        "valid_start_date": "2025-11-21",
        "milestones": {
          "outline_given": "2025-11-13 16:08:51",
          "data_received": "2025-11-13 16:57:50",
          "data_approved": "2025-11-18 14:20:35",
          "creative_received": null,
          "creative_approved": null,
          "mailed_on": null
        }
      },
      {
        "campaign_name": "Bally's Lincoln 2nd Chance Carnival/Princess/Holland Cruise",
        "mail_type": "6x9 Postcard",
        "job_submitted": false,
        "postage": "Standard",
        "quantity": 0,
        "in_home_date": "2025-12-01",
        "valid_start_date": "2025-12-15",
        "milestones": {
          "outline_given": null,
          "data_received": null,
          "data_approved": null,
          "creative_received": null,
          "creative_approved": null,
          "mailed_on": null
        }
      }
    ]
  },
  {
    "property": "Tiverton",
    "year": 2025,
    "month": "December",
    "jobs": [
      {
        "campaign_name": "Bally's Tiverton December Slot Core 8 Page Booklet",
        "mail_type": "Core/Newsletter",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 4473,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-05",
        "milestones": {
          "outline_given": "2025-10-14",
          "data_received": "2025-11-07 16:19:52",
          "data_approved": "2025-11-14 14:22:36",
          "creative_received": "2025-11-07 13:26:53",
          "creative_approved": "2025-11-14 14:22:36",
          "mailed_on": "2025-11-20"
        }
      },
      {
        "campaign_name": "Bally's Tiverton December Slot Core 12 Page Booklet",
        "mail_type": "Core/Newsletter",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 16889,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-05",
        "milestones": {
          "outline_given": "2025-11-07 13:26:53",
          "data_received": "2025-11-14 14:06:51",
          "data_approved": "2025-10-14",
          "creative_received": "2025-11-14 14:06:48",
          "creative_approved": "2025-11-21",
          "mailed_on": "2025-11-20"
        }
      },
      {
        "campaign_name": "Bally's Tiverton December HE GC Slots Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 736,
        "in_home_date": "2025-12-02",
        "valid_start_date": "2025-12-20",
        "milestones": {
          "outline_given": "2025-11-18 16:29:01",
          "data_received": "2025-11-20",
          "data_approved": "2025-11-28 10:01:51",
          "creative_received": "2025-11-18 16:29:01",
          "creative_approved": "2025-11-28 10:01:50",
          "mailed_on": "2025-12-05"
        }
      },
      {
        "campaign_name": "Bally's Tiverton December HE GC Tables Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 449,
        "in_home_date": "2025-12-02",
        "valid_start_date": "2025-12-20",
        "milestones": {
          "outline_given": "2025-11-18 16:29:01",
          "data_received": "2025-11-20",
          "data_approved": "2025-11-28 10:00:16",
          "creative_received": "2025-11-18 16:29:01",
          "creative_approved": "2025-11-28 10:00:16",
          "mailed_on": "2025-12-05"
        }
      },
      {
        "campaign_name": "Bally's Tiverton December Lucky Free Bet Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 5541,
        "in_home_date": "2025-11-18",
        "valid_start_date": "2025-12-06",
        "milestones": {
          "outline_given": "2025-10-28",
          "data_received": "2025-11-07 16:24:22",
          "data_approved": "2025-11-18 14:13:49",
          "creative_received": "2025-11-07 13:55:23",
          "creative_approved": "2025-11-18 14:13:49",
          "mailed_on": "2025-11-20"
        }
      },
      {
        "campaign_name": "Bally's Tiverton 12/5-6 First Chance Carnival/Princess Event",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 10865,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-05",
        "milestones": {
          "outline_given": "2025-10-28",
          "data_received": "2025-11-07 16:24:22",
          "data_approved": "2025-11-18 14:13:49",
          "creative_received": "2025-11-07 13:55:23",
          "creative_approved": "2025-11-18 14:23:19",
          "mailed_on": "2025-11-20"
        }
      },
      {
        "campaign_name": "Bally's Tiverton December Lucky Free Bet Postcard",
        "mail_type": "6x9 Postcard",
        "job_submitted": true,
        "postage": "Standard",
        "quantity": 5541,
        "in_home_date": "2025-11-17",
        "valid_start_date": "2025-12-05",
        "milestones": {
          "outline_given": "2025-10-28",
          "data_received": "2025-11-13 17:04:59",
          "data_approved": "2025-11-18 14:23:19",
          "creative_received": "2025-11-13",
          "creative_approved": "2025-11-18 14:23:19",
          "mailed_on": null
        }
      }
    ]
  }
];

function processPayload(): MailJob[] {
    const jobs: MailJob[] = [];
    
    HISTORICAL_PAYLOAD.forEach(group => {
        group.jobs.forEach((item: any, idx) => {
            const mailed = item.milestones.mailed_on;
            
            // Format timestamps to ISO strings for consistency if they aren't already
            // We accept "YYYY-MM-DD" or "YYYY-MM-DD HH:mm:ss"
            const formatTime = (t: string | null) => {
                if (!t) return undefined;
                // Attempt basic normalization: replace space with T for ISO parsability if needed
                // Or assume app handles it (Date.parse works with many formats)
                // Let's standardise to ISO if it contains space
                if (t.includes(' ')) return t.replace(' ', 'T');
                return t;
            };

            const job: MailJob = {
                id: `${group.property.toLowerCase()}-dec-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                campaign_name: item.campaign_name,
                mail_type: item.mail_type,
                property: group.property,
                job_submitted: item.job_submitted,
                submitted_date: item.job_submitted ? '2025-11-01' : undefined, // Default historical date for seeded data if true
                postage: item.postage,
                quantity: item.quantity,
                in_home_date: item.in_home_date,
                first_valid_date: item.valid_start_date,
                vendor_mail_date: mailed || '',
                milestones: {
                    outline_given: formatTime(item.milestones.outline_given),
                    data_received: formatTime(item.milestones.data_received),
                    data_approved: formatTime(item.milestones.data_approved),
                    creative_received: formatTime(item.milestones.creative_received),
                    creative_approved: formatTime(item.milestones.creative_approved),
                    mailed: formatTime(item.milestones.mailed_on)
                },
                created_at: new Date().toISOString()
            };
            jobs.push(job);
        });
    });
    
    return jobs;
}


// Combined export
export const SEED_JOBS: MailJob[] = [
    // Keep active foundation (Jan 2026)
    {
        id: 'lincoln-jan-core-8pg',
        campaign_name: 'Jan Slot Core Bklt - 8 pg',
        mail_type: 'Core/Newsletter',
        property: 'Lincoln',
        job_submitted: true,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-12',
        first_valid_date: '2026-01-01',
        vendor_mail_date: '',
        milestones: { outline_given: '2025-11-01T09:00:00Z' },
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-lucky-free-bet',
        campaign_name: 'Jan Lucky Free Bet Postcard',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: true,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-15',
        first_valid_date: '2026-01-02',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-champions-tables',
        campaign_name: 'Champions Event Tables',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-champions-slots',
        campaign_name: 'Champions Event Slots',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-legends-tables',
        campaign_name: 'Legends Event Tables',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-legends-slots',
        campaign_name: 'Legends Event Slots',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-lucky-3panel',
        campaign_name: 'Lucky Free Bet (3-Panel)',
        mail_type: 'Tri-Fold',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2026-01-12',
        first_valid_date: '2026-01-30',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-jan-lucky-2panel',
        campaign_name: 'Lucky Free Bet (2-Panel)',
        mail_type: 'Bi-Fold',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2026-01-13',
        first_valid_date: '2026-01-31',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-ri-tier-upgrade',
        campaign_name: 'RI Tier Upgrade',
        mail_type: 'Tri-Fold',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2026-01-08',
        first_valid_date: '2026-01-28',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-pd-experience',
        campaign_name: 'PD Experience Event',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-31',
        first_valid_date: '2026-01-20',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'lincoln-asian-pd-gc',
        campaign_name: 'Asian PD GC Event',
        mail_type: '6x9 Postcard',
        property: 'Lincoln',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2026-01-07',
        first_valid_date: '2026-01-27',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    
    // Tiverton Jan 2026
    {
        id: 'tiverton-jan-core-8pg',
        campaign_name: 'Jan Slot Core 8 Pg Bklt',
        mail_type: 'Core/Newsletter',
        property: 'Tiverton',
        job_submitted: true,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-12',
        first_valid_date: '2026-01-01',
        vendor_mail_date: '',
        milestones: { outline_given: '2025-11-01T09:00:00Z' },
        created_at: new Date().toISOString()
    },
    {
        id: 'tiverton-jan-he-gc-slots',
        campaign_name: 'Jan HE GC Slots',
        mail_type: '6x9 Postcard',
        property: 'Tiverton',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'tiverton-jan-he-gc-tables',
        campaign_name: 'Jan HE GC Tables',
        mail_type: '6x9 Postcard',
        property: 'Tiverton',
        job_submitted: false,
        postage: 'Standard',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },
    {
        id: 'tiverton-jan-lucky-free-bet',
        campaign_name: 'Jan Lucky Free Bet',
        mail_type: '6x9 Postcard',
        property: 'Tiverton',
        job_submitted: false,
        postage: 'First Class',
        quantity: 0,
        in_home_date: '2025-12-17',
        first_valid_date: '2026-01-06',
        vendor_mail_date: '',
        milestones: {},
        created_at: new Date().toISOString()
    },

    // Append Historical Data
    ...processPayload()
];
