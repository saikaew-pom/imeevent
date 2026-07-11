// Project archetypes for the "New project" wizard. Each template is a
// deterministic, hand-authored skeleton (Layer 1) that the brief (Layer 2)
// scales — which optional days apply, tier quantities, currency, budget
// posture. No AI here; that's Layer 3 (a later phase). Pure data + a pure
// generation function — no "server-only" — shared by client (wizard UI) and
// server (creation action).
import { Beat, EventMeta } from "./runOfShow";
import { FinancialAssumptions, PackageTier } from "./financials";
import { CostLine } from "./costStructure";
import { CurrencyCode } from "@/lib/format";
import { TaskCategory } from "./tasks";

export type EventTypeId =
  | "meeting"
  | "wedding"
  | "indian-wedding"
  | "incentive"
  | "gala"
  | "conference"
  | "blank";

export type BriefFieldType = "text" | "number" | "select";

export interface BriefFieldOption {
  value: string;
  label: string;
}

// A type-specific question the wizard renders in step 2, in addition to the
// universal core fields (name, date, venue, headcount, objective, budget
// posture, currency). Answers are captured by id into ProjectBriefInput.answers.
export interface BriefQuestion {
  id: string;
  label: string;
  type: BriefFieldType;
  placeholder?: string;
  options?: BriefFieldOption[];
}

// Becomes a Beat on generation. Times/energy are the hand-authored skeleton —
// the brief only scales which days/tiers apply, never rewrites this content.
export interface SkeletonBlock {
  segment: string;
  time: string; // "HH:MM"
  durationMin: number;
  energy: number;
  peak?: Beat["peak"];
  what: string;
  location?: string;
  lead?: string;
  audience?: Beat["audience"];
  attire?: string;
}

export interface SkeletonDay {
  label: string;
  optional?: boolean; // user can drop this day in the brief (e.g. rehearsal, farewell brunch)
  blocks: SkeletonBlock[];
}

export interface ProjectTemplate {
  id: EventTypeId;
  name: string;
  icon: string;
  shape: string; // e.g. "1 day · 1 room" — shown on the wizard card
  description: string;
  leadLabel: string;
  guestLabel: string; // vocabulary: "Guests" / "Delegates" / "Qualifiers" / "Attendees"
  days: SkeletonDay[];
  defaultCurrency: CurrencyCode;
  tiers: PackageTier[]; // starting revenue tiers ([] = cost-center event)
  costLines: CostLine[]; // starting cost lines, reusing the existing 5 cost groups
  taskPresetId: string | null; // → eventPresets.ts; null for blank
  starterDocs: string[]; // seeded as a starting checklist of tasks to collect
  brief: BriefQuestion[]; // type-specific brief questions
  aiHints: string; // archetype context/tone injected into the AI overlay prompt
}

const tier = (id: string, name: string, priceTHB: number, qty: number): PackageTier => ({
  id,
  name,
  priceTHB,
  qty,
});

const cost = (
  id: string,
  group: CostLine["group"],
  label: string,
  value: number,
  ent = false,
  day?: number
): CostLine => ({ id, group, label, value, ent, ...(day ? { day } : {}) });

// ---------------------------------------------------------------------------
// 1. Meeting / Board — proves the single-day path
// ---------------------------------------------------------------------------
const meetingTemplate: ProjectTemplate = {
  id: "meeting",
  name: "Meeting / Board",
  icon: "📊",
  shape: "1 day · 1 room",
  description: "Single-room business session: agenda, decisions and a clean wrap-up.",
  leadLabel: "~4 week lead",
  guestLabel: "Attendees",
  defaultCurrency: "THB",
  taskPresetId: "corporate",
  starterDocs: ["Meeting agenda", "Attendee list", "AV / tech rider"],
  aiHints:
    "Keep the tone crisp and businesslike. Agenda block names can reference the actual topics or objective given, rather than staying generic like 'Agenda Block 1'.",
  brief: [
    { id: "agendaOwner", label: "Agenda owner", type: "text", placeholder: "e.g. Head of Operations" },
    {
      id: "attendeeLevel",
      label: "Attendee level",
      type: "select",
      options: [
        { value: "staff", label: "Staff" },
        { value: "management", label: "Management" },
        { value: "board", label: "Board / Executive" },
      ],
    },
  ],
  days: [
    {
      label: "Meeting Day",
      blocks: [
        { segment: "Arrival & Coffee", time: "08:30", durationMin: 30, energy: 3, what: "Registration, name badges and coffee as attendees arrive.", location: "Foyer", lead: "Host" },
        { segment: "Opening & Objectives", time: "09:00", durationMin: 15, energy: 5, what: "Welcome, agenda walk-through and meeting objectives.", location: "Main room", lead: "Facilitator" },
        { segment: "Agenda Block 1", time: "09:15", durationMin: 75, energy: 6, peak: "peak1", what: "First working session.", location: "Main room", lead: "Facilitator" },
        { segment: "Break", time: "10:30", durationMin: 15, energy: 3, what: "Coffee break.", location: "Foyer" },
        { segment: "Agenda Block 2", time: "10:45", durationMin: 90, energy: 7, what: "Second working session.", location: "Main room", lead: "Facilitator" },
        { segment: "Working Lunch", time: "12:15", durationMin: 60, energy: 4, what: "Working lunch — informal continued discussion.", location: "Adjoining room", lead: "Host" },
        { segment: "Agenda Block 3", time: "13:15", durationMin: 90, energy: 7, what: "Afternoon working session.", location: "Main room", lead: "Facilitator" },
        { segment: "Decision Session", time: "14:45", durationMin: 45, energy: 8, peak: "summit", what: "Key decisions confirmed and owners assigned.", location: "Main room", lead: "Chair" },
        { segment: "Wrap-up & Next Steps", time: "15:30", durationMin: 20, energy: 4, what: "Recap decisions, actions and next steps.", location: "Main room", lead: "Facilitator" },
      ],
    },
  ],
  tiers: [],
  costLines: [
    cost("m-room", "tent", "Meeting room rental", 40000),
    cost("m-av", "production", "AV & staging", 60000),
    cost("m-catering", "fnb", "Coffee breaks & working lunch", 45000),
    cost("m-materials", "misc", "Name badges & materials", 8000),
    cost("m-staff", "others", "On-site coordination staff", 15000),
  ],
};

// ---------------------------------------------------------------------------
// 2. Wedding — Western
// ---------------------------------------------------------------------------
const weddingTemplate: ProjectTemplate = {
  id: "wedding",
  name: "Wedding — Western",
  icon: "💍",
  shape: "1 day (+ rehearsal)",
  description: "Classic single-day wedding: ceremony, reception and two emotional peaks.",
  leadLabel: "~12 month lead",
  guestLabel: "Guests",
  defaultCurrency: "THB",
  taskPresetId: "wedding",
  starterDocs: ["Venue floor plan", "Vendor contracts", "Seating chart"],
  aiHints:
    "Warm, romantic tone. Weave the couple's names and ceremony style into segment names and the concept line naturally, without inventing new structure.",
  brief: [
    { id: "coupleNames", label: "Couple's names", type: "text", placeholder: "e.g. Sarah & Tom" },
    {
      id: "ceremonyStyle",
      label: "Ceremony style",
      type: "select",
      options: [
        { value: "religious", label: "Religious" },
        { value: "civil", label: "Civil" },
        { value: "destination", label: "Destination" },
      ],
    },
  ],
  days: [
    {
      label: "Rehearsal",
      optional: true,
      blocks: [
        { segment: "Rehearsal Walk-through", time: "17:00", durationMin: 45, energy: 3, what: "Walk the ceremony order with the wedding party.", location: "Ceremony site", lead: "Celebrant" },
        { segment: "Rehearsal Dinner", time: "19:00", durationMin: 120, energy: 6, peak: "peak1", what: "Family dinner and toasts the night before.", location: "Private dining room", lead: "MC" },
      ],
    },
    {
      label: "Wedding Day",
      blocks: [
        { segment: "Hair, Makeup & Prep", time: "10:00", durationMin: 120, energy: 3, what: "Bridal party prep and getting-ready photos.", location: "Bridal suite", lead: "Photographer" },
        { segment: "Ceremony", time: "16:00", durationMin: 30, energy: 8, peak: "peak1", what: "Processional, vows and ring exchange.", location: "Ceremony lawn", lead: "Celebrant" },
        { segment: "Cocktail Hour", time: "16:30", durationMin: 60, energy: 5, what: "Guests mingle with drinks and canapés while photos are taken.", location: "Terrace", lead: "F&B" },
        { segment: "Reception Entrance", time: "18:00", durationMin: 15, energy: 7, what: "Grand entrance of the newlyweds and wedding party.", location: "Ballroom", lead: "MC" },
        { segment: "Dinner & Speeches", time: "18:15", durationMin: 90, energy: 6, what: "Plated dinner service with toasts from family and friends.", location: "Ballroom", lead: "MC" },
        { segment: "First Dance", time: "19:45", durationMin: 15, energy: 9, peak: "summit", what: "The couple's first dance, followed by parent dances.", location: "Ballroom", lead: "Band / DJ" },
        { segment: "Open Dance Floor", time: "20:00", durationMin: 120, energy: 9, what: "Dance floor opens to all guests.", location: "Ballroom", lead: "DJ" },
        { segment: "Send-off", time: "22:00", durationMin: 20, energy: 7, what: "Farewell send-off — sparklers, petals or a final toast.", location: "Main entrance", lead: "MC" },
      ],
    },
  ],
  tiers: [tier("guest-package", "Wedding Package (per guest)", 4500, 100)],
  costLines: [
    cost("w-venue", "tent", "Venue & ceremony setup", 150000),
    cost("w-decor", "production", "Florals, decor & styling", 120000),
    cost("w-band", "production", "Band / DJ & MC", 90000, true),
    cost("w-photo", "misc", "Photography & videography", 80000),
    cost("w-planner", "others", "Wedding planner fee", 60000),
    cost("w-fnb", "fnb", "Catering & beverage", 180000),
  ],
};

// ---------------------------------------------------------------------------
// 3. Wedding — Indian / Multi-day
// ---------------------------------------------------------------------------
const indianWeddingTemplate: ProjectTemplate = {
  id: "indian-wedding",
  name: "Wedding — Indian",
  icon: "🪔",
  shape: "3–4 days · buyout",
  description: "Multi-day celebration: Mehndi, Haldi & Sangeet, the wedding ceremony and reception.",
  leadLabel: "~12 month lead",
  guestLabel: "Guests",
  defaultCurrency: "INR",
  taskPresetId: "indian-wedding",
  starterDocs: ["Muhurat confirmation", "Function-wise floor plans", "Rooming list"],
  aiHints:
    "Rich, celebratory tone honoring each function's traditions. Reference the couple's names naturally across functions.",
  brief: [
    { id: "coupleNames", label: "Couple's names", type: "text", placeholder: "e.g. Priya & Arjun" },
  ],
  days: [
    {
      label: "Mehndi",
      optional: true,
      blocks: [
        { segment: "Guest Arrivals", time: "15:00", durationMin: 120, energy: 3, what: "Out-of-town guests check in.", location: "Hotel lobby", lead: "Planner" },
        { segment: "Mehndi Ceremony", time: "18:00", durationMin: 180, energy: 7, peak: "peak1", what: "Henna application with music, dhol and light bites.", location: "Garden lawn", lead: "Mehndi artist" },
      ],
    },
    {
      label: "Haldi & Sangeet",
      blocks: [
        { segment: "Haldi Ceremony", time: "11:00", durationMin: 90, energy: 6, what: "Turmeric ceremony for the bride and groom's families.", location: "Courtyard", lead: "Priest" },
        { segment: "Rest & Family Time", time: "14:00", durationMin: 180, energy: 3, what: "Afternoon rest before the evening function.", location: "Guest rooms", lead: "Planner" },
        { segment: "Sangeet Night", time: "19:00", durationMin: 240, energy: 9, peak: "peak2", what: "Family performances, choreographed dances and DJ.", location: "Ballroom", lead: "Choreographer" },
      ],
    },
    {
      label: "Baraat, Ceremony & Reception",
      blocks: [
        { segment: "Baraat (Groom's Procession)", time: "16:00", durationMin: 45, energy: 8, what: "Groom's procession with dhol, horse / car and dancing.", location: "Hotel entrance", lead: "Planner" },
        { segment: "Wedding Ceremony", time: "17:00", durationMin: 120, energy: 8, peak: "peak3", what: "Rituals at the mandap per the fixed muhurat.", location: "Mandap lawn", lead: "Priest" },
        { segment: "Reception Entrance", time: "20:00", durationMin: 20, energy: 8, what: "Newlyweds' grand entrance to the reception.", location: "Ballroom", lead: "MC" },
        { segment: "Reception Dinner & Dance", time: "20:30", durationMin: 150, energy: 9, peak: "summit", what: "Multi-cuisine dinner, speeches and open dance floor.", location: "Ballroom", lead: "DJ" },
      ],
    },
    {
      label: "Farewell Brunch",
      optional: true,
      blocks: [
        { segment: "Farewell Brunch", time: "11:00", durationMin: 120, energy: 4, what: "Casual brunch send-off for out-of-town guests.", location: "Poolside", lead: "Planner" },
      ],
    },
  ],
  tiers: [tier("guest-package", "Per-Guest Function Package", 3500, 300)],
  // Whole-event lines (room block, photographer retainer, planner fee) carry
  // no day tag; decor/entertainment/catering are split per function so the
  // Costing page can show a genuine per-day spend breakdown.
  costLines: [
    cost("iw-roomblock", "tent", "Hotel room block / buyout", 900000),
    cost("iw-photo", "misc", "Photography & cinematography", 220000),
    cost("iw-planner", "others", "Wedding planner & coordination", 180000),
    cost("iw-decor-mehndi", "production", "Mehndi decor & florals", 80000, false, 1),
    cost("iw-decor-sangeet", "production", "Haldi & Sangeet stage decor", 150000, false, 2),
    cost("iw-decor-wedding", "production", "Mandap & reception decor", 320000, false, 3),
    cost("iw-decor-farewell", "production", "Farewell brunch styling", 50000, false, 4),
    cost("iw-ent-mehndi", "production", "Mehndi music & dhol", 40000, true, 1),
    cost("iw-ent-sangeet", "production", "Sangeet choreography & DJ", 120000, true, 2),
    cost("iw-ent-wedding", "production", "Baraat dhol & reception DJ", 90000, true, 3),
    cost("iw-fnb-mehndi", "fnb", "Mehndi catering", 60000, false, 1),
    cost("iw-fnb-sangeet", "fnb", "Haldi & Sangeet catering", 100000, false, 2),
    cost("iw-fnb-wedding", "fnb", "Wedding day multi-cuisine catering", 280000, false, 3),
    cost("iw-fnb-farewell", "fnb", "Farewell brunch catering", 60000, false, 4),
  ],
};

// ---------------------------------------------------------------------------
// 4. Incentive Travel
// ---------------------------------------------------------------------------
const incentiveTemplate: ProjectTemplate = {
  id: "incentive",
  name: "Incentive Travel",
  icon: "🏆",
  shape: "4–5 days · journey",
  description: "Multi-day reward trip: arrival, leisure, business + team-building, and an awards night.",
  leadLabel: "~7 month lead",
  guestLabel: "Qualifiers",
  defaultCurrency: "USD",
  taskPresetId: "incentive",
  starterDocs: ["Qualifier list", "DMC program grid", "Visa / insurance notes"],
  aiHints:
    "Recognition and achievement tone. Reference the origin city and the qualifying achievement where natural, especially for the Awards Night.",
  brief: [
    { id: "originCity", label: "Origin city", type: "text", placeholder: "e.g. Bangkok" },
    { id: "qualifierCount", label: "Qualifiers (vs. guest companions)", type: "number", placeholder: "e.g. 40" },
  ],
  days: [
    {
      label: "Arrival",
      blocks: [
        { segment: "Arrivals & Transfers", time: "10:00", durationMin: 240, energy: 3, what: "Staggered arrivals with DMC meet & greet and transfers.", location: "Airport / hotel", lead: "DMC", audience: "all", attire: "Travel casual" },
        { segment: "Welcome Reception", time: "19:00", durationMin: 120, energy: 6, peak: "peak1", what: "Welcome drinks and a light program to open the trip.", location: "Hotel terrace", lead: "Host", audience: "all", attire: "Smart casual" },
      ],
    },
    {
      label: "Leisure Day",
      optional: true,
      blocks: [
        { segment: "Leisure / Free Time", time: "09:00", durationMin: 240, energy: 3, what: "Free time or optional activity add-ons.", location: "Resort", lead: "Host", audience: "optional", attire: "Resort wear" },
        { segment: "Optional Excursion", time: "13:00", durationMin: 180, energy: 5, what: "Optional half-day excursion for those who opt in.", location: "Off-site", lead: "DMC", audience: "optional", attire: "Activewear" },
      ],
    },
    {
      label: "Business & Awards Night",
      blocks: [
        { segment: "Business Session", time: "09:00", durationMin: 120, energy: 5, what: "Company update and recognition briefing.", location: "Meeting room", lead: "Facilitator", audience: "core", attire: "Business casual" },
        { segment: "Team-building Activity", time: "13:00", durationMin: 150, energy: 7, what: "Group team-building activity.", location: "Resort grounds", lead: "Activity vendor", audience: "all", attire: "Activewear" },
        { segment: "Awards Night", time: "19:00", durationMin: 180, energy: 10, peak: "summit", what: "Gala dinner and awards ceremony recognizing top qualifiers.", location: "Ballroom / beachfront", lead: "Awards producer", audience: "all", attire: "Black tie" },
      ],
    },
    {
      label: "Leisure & Happy Hour",
      optional: true,
      blocks: [
        { segment: "Leisure / Free Time", time: "09:00", durationMin: 300, energy: 3, what: "Free time to relax or explore.", location: "Resort", lead: "Host", audience: "optional", attire: "Resort wear" },
        { segment: "Farewell Happy Hour", time: "18:00", durationMin: 90, energy: 6, what: "Casual sundowner send-off before the final night.", location: "Beach bar", lead: "Host", audience: "all", attire: "Smart casual" },
      ],
    },
    {
      label: "Departure",
      blocks: [
        { segment: "Check-out & Transfers", time: "08:00", durationMin: 240, energy: 2, what: "Staggered check-outs and airport transfers.", location: "Hotel / airport", lead: "DMC", audience: "all", attire: "Travel casual" },
      ],
    },
  ],
  tiers: [],
  costLines: [
    cost("inc-air", "others", "Group airfare", 45000),
    cost("inc-rooms", "tent", "Hotel rooms & buyout (all nights)", 60000),
    cost("inc-transfers", "others", "Transfers & ground transport", 8000),
    cost("inc-activities", "production", "Activities & team-building", 15000, true),
    cost("inc-awards", "production", "Awards night production & entertainment", 35000, true),
    cost("inc-fnb", "fnb", "F&B across all functions", 40000),
  ],
};

// ---------------------------------------------------------------------------
// 5. Gala / Celebration — generic shape (JW itself was hand-built, not
// generated from this template; new gala projects start from this instead).
// ---------------------------------------------------------------------------
const galaTemplate: ProjectTemplate = {
  id: "gala",
  name: "Gala / Celebration",
  icon: "✨",
  shape: "1 evening · rising arc",
  description: "Large formal event built as one rising energy curve to a headline finale.",
  leadLabel: "~6 month lead",
  guestLabel: "Guests",
  defaultCurrency: "THB",
  taskPresetId: "gala",
  starterDocs: ["BEO (Banquet Event Order)", "Floor plan", "Show / act contracts"],
  aiHints:
    "Elegant, cinematic tone. Weave the given theme into segment names and descriptions — e.g. a generic 'Welcome & Arrival' becomes something evocative of the theme.",
  brief: [{ id: "theme", label: "Theme", type: "text", placeholder: "e.g. Emerald & Gold garden-in-bloom" }],
  days: [
    {
      label: "Gala Night",
      blocks: [
        { segment: "Welcome & Arrival", time: "18:30", durationMin: 45, energy: 4, what: "Guests arrive to a styled welcome with ambient entertainment.", location: "Pre-function area", lead: "MC" },
        { segment: "Doors Open", time: "19:15", durationMin: 15, energy: 5, what: "Guests move into the main room.", location: "Main ballroom", lead: "MC" },
        { segment: "Welcome & Show 1", time: "19:30", durationMin: 20, energy: 7, peak: "peak1", what: "Opening remarks followed by the first signature show.", location: "Main stage", lead: "Stage manager" },
        { segment: "Dinner Service", time: "19:50", durationMin: 60, energy: 5, what: "Dinner service with ambient music.", location: "Main ballroom", lead: "F&B" },
        { segment: "Show 2", time: "20:50", durationMin: 20, energy: 8, peak: "peak2", what: "Second signature show to re-lift the room after dinner.", location: "Main stage", lead: "Stage manager" },
        { segment: "Dance Floor / Band & DJ", time: "21:10", durationMin: 60, energy: 8, what: "Live band and DJ open the dance floor.", location: "Main ballroom", lead: "Band / DJ" },
        { segment: "Finale", time: "22:10", durationMin: 20, energy: 10, peak: "summit", what: "The night's headline moment — the emotional and visual peak.", location: "Main stage", lead: "Stage manager" },
        { segment: "Afterglow", time: "22:30", durationMin: 60, energy: 6, what: "The party continues as the formal program winds down.", location: "Main ballroom", lead: "DJ" },
      ],
    },
  ],
  tiers: [tier("vvip", "VVIP Package", 15000, 20), tier("vip", "VIP Package", 10000, 120), tier("child", "Child", 4000, 15)],
  costLines: [
    cost("g-tent", "tent", "Venue / tent rental", 120000),
    cost("g-av", "production", "Sound, lighting & staging", 200000, true),
    cost("g-band", "production", "Band, DJ & MC", 150000, true),
    cost("g-decor", "production", "Centerpieces & florals", 30000),
    cost("g-misc", "misc", "Guest collateral & wristbands", 15000),
    cost("g-labour", "others", "Staffing & logistics", 40000),
    cost("g-fnb", "fnb", "Food & beverage cost", 220000),
  ],
};

// ---------------------------------------------------------------------------
// 6. Conference / Convention — specced, queued behind the four above
// ---------------------------------------------------------------------------
const conferenceTemplate: ProjectTemplate = {
  id: "conference",
  name: "Conference / Convention",
  icon: "🎤",
  shape: "1–3 days · tracks",
  description: "Business event with keynotes, breakout tracks, sponsors and networking.",
  leadLabel: "~5 month lead",
  guestLabel: "Delegates",
  defaultCurrency: "USD",
  taskPresetId: "corporate",
  starterDocs: ["Agenda & speaker deck", "Sponsor prospectus", "AV / livestream spec"],
  aiHints:
    "Professional but energetic tone. Reference the number of tracks and sponsor involvement where relevant.",
  brief: [
    { id: "tracks", label: "Number of tracks", type: "number", placeholder: "e.g. 2" },
    {
      id: "sponsors",
      label: "Include sponsorship revenue?",
      type: "select",
      options: [
        { value: "yes", label: "Yes" },
        { value: "no", label: "No" },
      ],
    },
  ],
  days: [
    {
      label: "Conference Day 1",
      blocks: [
        { segment: "Registration", time: "08:00", durationMin: 60, energy: 3, what: "Badge pickup and morning coffee.", location: "Foyer", lead: "Registration desk", audience: "all" },
        { segment: "Opening Keynote", time: "09:00", durationMin: 45, energy: 8, peak: "peak1", what: "Headline keynote to open the conference.", location: "Main hall", lead: "MC", audience: "all" },
        { segment: "Breakout Session (Track A)", time: "10:00", durationMin: 60, energy: 6, what: "Track A breakout session.", location: "Breakout Room A", lead: "Speaker", audience: "core" },
        { segment: "Sponsored Lunch", time: "12:00", durationMin: 75, energy: 5, what: "Networking lunch hosted by a sponsor.", location: "Exhibition hall", lead: "F&B", audience: "all" },
        { segment: "Breakout Session (Track A)", time: "13:30", durationMin: 60, energy: 6, what: "Afternoon Track A breakout.", location: "Breakout Room A", lead: "Speaker", audience: "core" },
        { segment: "Panel Discussion", time: "15:00", durationMin: 60, energy: 7, peak: "peak2", what: "Panel of industry speakers.", location: "Main hall", lead: "Moderator", audience: "all" },
        { segment: "Evening Networking", time: "18:00", durationMin: 90, energy: 6, what: "Drinks and networking to close day one.", location: "Rooftop", lead: "Host", audience: "all", attire: "Smart casual" },
      ],
    },
    {
      label: "Conference Day 2",
      optional: true,
      blocks: [
        { segment: "Morning Coffee", time: "08:30", durationMin: 30, energy: 3, what: "Coffee ahead of day two.", location: "Foyer", lead: "Host", audience: "all" },
        { segment: "Breakout Session (Track A)", time: "09:00", durationMin: 60, energy: 6, what: "Track A breakout.", location: "Breakout Room A", lead: "Speaker", audience: "core" },
        { segment: "Sponsored Lunch", time: "12:00", durationMin: 75, energy: 5, what: "Networking lunch hosted by a sponsor.", location: "Exhibition hall", lead: "F&B", audience: "all" },
        { segment: "Breakout Session (Track A)", time: "13:30", durationMin: 60, energy: 6, what: "Afternoon Track A breakout.", location: "Breakout Room A", lead: "Speaker", audience: "core" },
        { segment: "Closing Keynote", time: "15:30", durationMin: 45, energy: 9, peak: "summit", what: "Closing keynote to send delegates off.", location: "Main hall", lead: "MC", audience: "all" },
      ],
    },
  ],
  tiers: [
    tier("early-bird", "Early-bird Ticket", 8000, 80),
    tier("standard", "Standard Ticket", 12000, 150),
    tier("vip", "VIP Ticket", 20000, 20),
    tier("sponsorship", "Sponsorship Package", 200000, 3),
  ],
  costLines: [
    cost("c-venue", "tent", "Venue & breakout rooms", 180000),
    cost("c-av", "production", "AV, staging & livestream", 250000, true),
    cost("c-speakers", "production", "Speaker fees & travel", 120000),
    cost("c-collateral", "misc", "Badges, signage & collateral", 40000),
    cost("c-staff", "others", "Registration & event staff", 50000),
    cost("c-fnb", "fnb", "Catering (all sessions)", 220000),
  ],
};

// ---------------------------------------------------------------------------
// 7. Blank — the current behavior, kept as an explicit "start from scratch"
// ---------------------------------------------------------------------------
const blankTemplate: ProjectTemplate = {
  id: "blank",
  name: "Blank",
  icon: "⬜",
  shape: "start from scratch",
  description: "No starting content — build the program, financials and tasks yourself.",
  leadLabel: "",
  guestLabel: "Guests",
  defaultCurrency: "THB",
  taskPresetId: null,
  starterDocs: [],
  aiHints: "There is no preset structure — focus only on writing a warm one-line concept from the objective and notes.",
  brief: [],
  days: [],
  tiers: [],
  costLines: [],
};

// Build order (locked): Meeting → Western Wedding → Indian Wedding →
// Incentive Travel. Gala already ships as the JW shape, so it seeds the
// library on day one; conference is specced but queued behind these four.
// Blank stays last as the explicit "start from scratch" choice.
export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  meetingTemplate,
  weddingTemplate,
  indianWeddingTemplate,
  incentiveTemplate,
  galaTemplate,
  conferenceTemplate,
  blankTemplate,
];

export function getProjectTemplate(id: string): ProjectTemplate | undefined {
  return PROJECT_TEMPLATES.find((t) => t.id === id);
}

// Per-archetype vocabulary for the one UI noun that varies most across event
// types — "guests" for a gala/wedding, "delegates" for a conference,
// "qualifiers" for incentive travel. Falls back to "Guests" for blank/legacy
// projects with no eventType (JW included), so existing copy is unchanged.
export function guestLabelFor(eventType?: string): string {
  return (eventType && getProjectTemplate(eventType)?.guestLabel) || "Guests";
}

// A flat energy sparkline for the wizard card — sampled from every day
// (including optional ones) purely for the illustrative curve.
export function templateSparkline(template: ProjectTemplate): number[] {
  return template.days.flatMap((d) => d.blocks.map((b) => b.energy));
}

// ---------------------------------------------------------------------------
// Generation: skeleton × brief → the concrete state written on project creation.
// ---------------------------------------------------------------------------

export type BudgetPosture = "lean" | "standard" | "premium";

const BUDGET_MULTIPLIER: Record<BudgetPosture, number> = {
  lean: 0.8,
  standard: 1,
  premium: 1.35,
};

export interface ProjectBriefInput {
  venue: string;
  headcount: number;
  objective: string;
  budgetPosture: BudgetPosture;
  currency: CurrencyCode;
  activeDayLabels: string[]; // labels of optional days to KEEP; non-optional days are always included
  answers: Record<string, string>; // type-specific brief answers, keyed by BriefQuestion.id
}

export interface GeneratedProjectSetup {
  meta: EventMeta;
  program: Beat[];
  financials: FinancialAssumptions;
  taskPresetId: string | null;
  starterDocs: string[];
  aiTasks?: AITaskSuggestion[]; // set only when an AI overlay was applied
}

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hh = Math.floor(wrapped / 60)
    .toString()
    .padStart(2, "0");
  const mm = (wrapped % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function computeTiming(activeDays: SkeletonDay[]): string {
  if (activeDays.length === 0) return "";
  if (activeDays.length > 1) return `${activeDays.length} days`;
  const blocks = activeDays[0].blocks;
  if (blocks.length === 0) return "";
  const start = blocks[0].time;
  const last = blocks[blocks.length - 1];
  const end = addMinutes(last.time, last.durationMin);
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let spanMin = eh * 60 + em - (sh * 60 + sm);
  if (spanMin <= 0) spanMin += 1440; // crossed midnight
  const hours = Math.floor(spanMin / 60);
  const mins = spanMin % 60;
  const hourLabel = mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
  return `${start} – ${end} (${hourLabel})`;
}

function formatDateLabel(startISO: string, numDays: number): string {
  const start = new Date(`${startISO}T00:00:00Z`);
  if (numDays <= 1) {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(start);
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + (numDays - 1));
  const dayFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", day: "numeric", timeZone: "UTC" });
  const monthYearFmt = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return `${dayFmt.format(start)} – ${dayFmt.format(end)} ${monthYearFmt.format(end)}`;
}

function buildConcept(template: ProjectTemplate, brief: ProjectBriefInput): string {
  const parts: string[] = [];
  if (brief.objective.trim()) parts.push(brief.objective.trim());
  const a = brief.answers;
  if (a.coupleNames) {
    const style = a.ceremonyStyle ? `${a.ceremonyStyle} ` : "";
    parts.push(`A ${style}celebration built around ${a.coupleNames}'s day.`);
  }
  if (a.originCity) parts.push(`Travelling from ${a.originCity}.`);
  if (a.attendeeLevel) parts.push(`Audience: ${a.attendeeLevel}.`);
  if (template.id === "conference" && Number(a.tracks) > 1) {
    parts.push(`Running in parallel across ${Number(a.tracks)} tracks.`);
  }
  return parts.join(" ");
}

export function generateProjectSetup(
  template: ProjectTemplate,
  eventDateISO: string,
  brief: ProjectBriefInput
): GeneratedProjectSetup {
  const activeDays = template.days.filter(
    (d) => !d.optional || brief.activeDayLabels.includes(d.label)
  );
  // Cost lines tagged to a specific function (SkeletonDay) reference the
  // template's own day position — remap to the filtered/active day index,
  // exactly like Beat.day above, and drop lines whose function was excluded.
  const dayRemap = new Map<number, number>();
  template.days.forEach((d, origIdx) => {
    const activeIdx = activeDays.indexOf(d);
    if (activeIdx !== -1) dayRemap.set(origIdx + 1, activeIdx + 1);
  });

  const program: Beat[] = [];
  activeDays.forEach((day, dayIdx) => {
    day.blocks.forEach((block, blockIdx) => {
      program.push({
        id: `${template.id}-d${dayIdx + 1}-b${blockIdx + 1}`,
        ...(dayIdx > 0 ? { day: dayIdx + 1 } : {}),
        time: block.time,
        durationMin: block.durationMin,
        segment: block.segment,
        location: block.location ?? "",
        energy: block.energy,
        peak: block.peak,
        what: block.what,
        lead: block.lead ?? "",
        linkedActs: [],
        custom: true,
        ...(block.audience ? { audience: block.audience } : {}),
        ...(block.attire ? { attire: block.attire } : {}),
      });
    });
  });

  // Agenda owner → lead on the very first block (meeting archetype).
  if (brief.answers.agendaOwner && program[0]) {
    program[0] = { ...program[0], lead: brief.answers.agendaOwner };
  }

  const headcount = Math.max(1, Math.round(brief.headcount) || 0);
  const mult = BUDGET_MULTIPLIER[brief.budgetPosture];
  const templateTierTotal = template.tiers.reduce((s, t) => s + t.qty, 0);
  let tiers: PackageTier[] = template.tiers.map((t) => {
    const share = templateTierTotal > 0 ? t.qty / templateTierTotal : 0;
    const qty = template.tiers.length === 1 ? headcount : Math.max(0, Math.round(headcount * share));
    return { ...t, qty, priceTHB: Math.round(t.priceTHB * mult) };
  });
  if (brief.answers.sponsors === "no") {
    tiers = tiers.filter((t) => t.id !== "sponsorship");
  }
  const costLines: CostLine[] = template.costLines
    .filter((l) => l.day === undefined || dayRemap.has(l.day))
    .map((l) => ({
      ...l,
      value: Math.round(l.value * mult),
      ...(l.day !== undefined ? { day: dayRemap.get(l.day) } : {}),
    }));

  const financials: FinancialAssumptions = {
    currency: brief.currency,
    tiers,
    costLines,
  };

  const qualifierCount = Number(brief.answers.qualifierCount || 0);
  const guestsLine =
    qualifierCount > 0
      ? `${qualifierCount} ${template.guestLabel.toLowerCase()} + ${Math.max(
          0,
          headcount - qualifierCount
        )} guest companions`
      : activeDays.length > 0
      ? `${headcount} ${template.guestLabel.toLowerCase()}`
      : "";

  const meta: EventMeta = {
    venue: brief.venue,
    date: activeDays.length > 0 ? formatDateLabel(eventDateISO, activeDays.length) : "",
    timing: computeTiming(activeDays),
    guests: guestsLine,
    theme: brief.answers.theme ?? "",
    spaces: "",
    concept: buildConcept(template, brief),
    ...(template.id !== "blank" ? { eventType: template.id, days: activeDays.length } : {}),
  };

  return {
    meta,
    program,
    financials,
    taskPresetId: template.taskPresetId,
    starterDocs: template.starterDocs,
  };
}

// ---------------------------------------------------------------------------
// AI enrichment (Layer 3): one validated MiniMax call tailors the deterministic
// setup — rename blocks, rewrite descriptions and the concept line, suggest a
// few extra tasks. It never invents structure: day/block count, order and
// timing are untouched, and the financial shape is never in scope. Kept
// deliberately narrow and always optional — nothing here can block or corrupt
// project creation; a failed or malformed response just means no overlay.
// ---------------------------------------------------------------------------

export interface AITaskSuggestion {
  title: string;
  description: string;
  category: TaskCategory;
}

export interface AIOverlay {
  concept: string;
  blocks: { segment: string; what: string }[]; // [] if the model's block count didn't match — never partially applied
  tasks: AITaskSuggestion[];
}

const TASK_CATEGORIES = new Set<TaskCategory>([
  "venue",
  "fnb",
  "entertainment",
  "marketing",
  "finance",
  "general",
]);

// Builds the single prompt sent to MiniMax: the archetype's tone hints, the
// brief (including free-text notes), and the deterministic block list keyed
// by index so the model's response can be mapped back positionally.
export function buildOverlayPrompt(
  template: ProjectTemplate,
  setup: GeneratedProjectSetup,
  brief: ProjectBriefInput,
  notes: string
): string {
  const blockLines = setup.program.length
    ? setup.program
        .map((b, i) => `${i} | Day ${b.day ?? 1} | ${b.time} | ${b.segment} | ${b.what}`)
        .join("\n")
    : "(no program blocks)";

  const answerLines =
    Object.entries(brief.answers)
      .filter(([, v]) => v)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join("\n") || "- (no extra brief answers)";

  return `You are helping tailor an event-planning template to one specific real event. Archetype: ${template.name}. ${template.aiHints}

Brief:
- Venue: ${brief.venue || "(not given)"}
- ${template.guestLabel}: ${brief.headcount}
- Objective: ${brief.objective || "(not given)"}
- Budget posture: ${brief.budgetPosture}
${answerLines}
- Extra notes from the client: ${notes.trim() || "(none)"}

Here is the deterministic program skeleton, one block per line as "index | day | time | segment | what":
${blockLines}

Task:
1. Write one short, warm concept line (1-2 sentences) tailored to this event from the brief and notes.
2. For EACH block listed above, propose a refined "segment" name and "what" description tailored to this event. Keep the same meaning, order and timing — do not change what happens, just make it feel bespoke rather than generic. Return exactly ${setup.program.length} entries, in the same order as listed.
3. Suggest 0–5 EXTRA prep tasks (title, one-line description, and category — one of: venue, fnb, entertainment, marketing, finance, general) specific to this event's brief/notes, beyond the standard checklist.

Respond with ONLY a JSON object, no markdown fences, in exactly this shape:
{"concept": "...", "blocks": [{"segment": "...", "what": "..."}], "tasks": [{"title": "...", "description": "...", "category": "general"}]}`;
}

// Defensive JSON parse: strips markdown fences, validates every field's type
// and length, and clamps or drops anything malformed rather than throwing —
// mirrors parseSlideCopy's pattern in lib/builder/presentation.ts. A block
// count mismatch discards the whole blocks array (never partially applied)
// but concept/tasks are still salvaged independently.
export function parseAIOverlay(raw: string, expectedBlockCount: number): AIOverlay {
  const empty: AIOverlay = { concept: "", blocks: [], tasks: [] };
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== "object") return empty;
  const p = parsed as Record<string, unknown>;

  const concept = typeof p.concept === "string" ? p.concept.trim().slice(0, 400) : "";

  let blocks: AIOverlay["blocks"] = [];
  if (Array.isArray(p.blocks) && p.blocks.length === expectedBlockCount) {
    const rawBlocks = p.blocks as unknown[];
    const valid = rawBlocks.every(
      (b) =>
        b &&
        typeof b === "object" &&
        typeof (b as Record<string, unknown>).segment === "string" &&
        typeof (b as Record<string, unknown>).what === "string"
    );
    if (valid) {
      blocks = rawBlocks.map((b) => {
        const r = b as Record<string, string>;
        return {
          segment: r.segment.trim().slice(0, 80),
          what: r.what.trim().slice(0, 400),
        };
      });
    }
  }

  let tasks: AITaskSuggestion[] = [];
  if (Array.isArray(p.tasks)) {
    tasks = (p.tasks as unknown[])
      .filter(
        (t) =>
          t &&
          typeof t === "object" &&
          typeof (t as Record<string, unknown>).title === "string" &&
          (t as Record<string, unknown>).title
      )
      .slice(0, 5)
      .map((t) => {
        const r = t as Record<string, unknown>;
        const category = typeof r.category === "string" && TASK_CATEGORIES.has(r.category as TaskCategory)
          ? (r.category as TaskCategory)
          : "general";
        return {
          title: String(r.title).trim().slice(0, 120),
          description: typeof r.description === "string" ? r.description.trim().slice(0, 300) : "",
          category,
        };
      });
  }

  return { concept, blocks, tasks };
}

// Merges a (validated) overlay onto the deterministic setup. Pure — never
// touches financials/taskPresetId/starterDocs, since those are outside the
// AI's contract. Safe to call with overlay=null (returns setup unchanged).
export function applyAIOverlay(
  setup: GeneratedProjectSetup,
  overlay: AIOverlay | null
): GeneratedProjectSetup {
  if (!overlay) return setup;

  const program =
    overlay.blocks.length === setup.program.length && overlay.blocks.length > 0
      ? setup.program.map((b, i) => ({
          ...b,
          segment: overlay.blocks[i].segment || b.segment,
          what: overlay.blocks[i].what || b.what,
        }))
      : setup.program;

  const meta = overlay.concept ? { ...setup.meta, concept: overlay.concept } : setup.meta;

  return { ...setup, meta, program, aiTasks: overlay.tasks };
}
