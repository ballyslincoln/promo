export interface JobTemplate {
  label: string;
  namePattern: string;
  type: string;
  postage: string;
  defaultInHomeDay: number;
}

export interface PropertyTemplates {
  [category: string]: JobTemplate[];
}

export const JOB_TEMPLATES: { [key: string]: PropertyTemplates } = {
  Lincoln: {
    "Core & Monthly": [
      {
        label: "Core Booklet (8pg)",
        namePattern: "{Month} Slot Core Bklt - 8 pg",
        type: "Core/Newsletter",
        postage: "Standard",
        defaultInHomeDay: 12
      },
      {
        label: "Core Booklet (12pg)",
        namePattern: "{Month} Slot Core Bklt - 12 pg",
        type: "Core/Newsletter",
        postage: "Standard",
        defaultInHomeDay: 12
      },
      {
        label: "Lucky Free Bet Postcard",
        namePattern: "{Month} Lucky Free Bet Postcard",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 15
      },
      {
        label: "RI Tier Upgrade",
        namePattern: "Bally's RI Tier Upgrade Postcard",
        type: "Tri-Fold",
        postage: "Standard",
        defaultInHomeDay: 8
      }
    ],
    "Events (Champions/Legends)": [
      {
        label: "Champions Event (Tables)",
        namePattern: "Champions Event Tables Postcard",
        type: "6x9 Postcard",
        postage: "First Class",
        defaultInHomeDay: 17
      },
      {
        label: "Champions Event (Slots)",
        namePattern: "Champions Event Slots Postcard",
        type: "6x9 Postcard",
        postage: "First Class",
        defaultInHomeDay: 17
      },
      {
        label: "Legends Event (Tables)",
        namePattern: "Legends Event Tables Postcard",
        type: "6x9 Postcard",
        postage: "First Class",
        defaultInHomeDay: 17
      },
      {
        label: "Legends Event (Slots)",
        namePattern: "Legends Event Slots Postcard",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 17
      }
    ],
    "Retention & Special": [
      {
        label: "Selfmailer (3-Panel)",
        namePattern: "{Month} Lucky Free Bet Selfmailer - 3 panel",
        type: "Tri-Fold",
        postage: "Standard",
        defaultInHomeDay: 17
      },
      {
        label: "Selfmailer (2-Panel)",
        namePattern: "{Month} Lucky Free Bet Selfmailer - 2 Panel",
        type: "Bi-Fold",
        postage: "Standard",
        defaultInHomeDay: 17
      },
      {
        label: "PD Experience Event",
        namePattern: "PD Experience Event Postcard",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 20
      },
      {
        label: "Asian PD GC Event",
        namePattern: "Asian PD GC Event Postcard",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 24
      },
      {
        label: "Carnival/Cruise Event",
        namePattern: "Chance Carnival/Princess/Holland Cruise",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 15
      },
      {
        label: "NYE Invite",
        namePattern: "New Years Eve Invite",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 10
      }
    ]
  },
  Tiverton: {
    "Core & Monthly": [
      {
        label: "Core Booklet (8pg)",
        namePattern: "{Month} Slot Core 8 Page Booklet",
        type: "Core/Newsletter",
        postage: "Standard",
        defaultInHomeDay: 12
      },
      {
        label: "Core Booklet (12pg)",
        namePattern: "{Month} Slot Core 12 Page Booklet",
        type: "Core/Newsletter",
        postage: "Standard",
        defaultInHomeDay: 12
      },
      {
        label: "Lucky Free Bet (First Class)",
        namePattern: "{Month} Lucky Free Bet Postcard",
        type: "6x9 Postcard",
        postage: "First Class",
        defaultInHomeDay: 17
      }
    ],
    "Events": [
      {
        label: "HE GC Slots",
        namePattern: "{Month} HE GC Slots Postcard",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 17
      },
      {
        label: "HE GC Tables",
        namePattern: "{Month} HE GC Tables Postcard",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 17
      },
      {
        label: "Carnival/Princess Event",
        namePattern: "First Chance Carnival/Princess Event",
        type: "6x9 Postcard",
        postage: "Standard",
        defaultInHomeDay: 15
      }
    ]
  }
};
