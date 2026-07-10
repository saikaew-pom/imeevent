// The JW Gala Garden Night master run of show — the "One Rising Curve, Four Peaks"
// timeline. Energy is a 1–10 score derived from the document's relative-energy bars.
// `linkedActs` point at catalogue ids where a beat maps to a real act.

export interface MediaItem {
  type: "image" | "video";
  src: string;
  poster?: string;
  label?: string;
}

export interface BeatLink {
  label: string;
  url: string;
}

export interface Beat {
  id: string;
  time: string;
  durationMin: number;
  segment: string;
  location: string;
  energy: number; // 1–10 manual baseline — overridden live when shows are linked
  peak?: "peak1" | "peak2" | "peak3" | "summit";
  what: string;
  lead: string;
  linkedActs?: string[];
  media?: { photo?: string; videoUrl?: string };
  gallery?: MediaItem[];
  links?: BeatLink[];
  refVideos?: string[]; // unlimited pasted YouTube/Vimeo reference links
  linkedTalent?: string[]; // talent entity ids (MC, band, performers, vendors)
  custom?: boolean; // true if added by the user in the planner (not the original run of show)
}

// Real event media captured at prior JW NYE galas (compressed for web).
const img = (name: string, label?: string): MediaItem => ({
  type: "image",
  src: `/media/${name}`,
  label,
});
const vid = (name: string, label?: string): MediaItem => ({
  type: "video",
  src: `/media/${name}`,
  poster: `/media/posters/${name.replace(".mp4", ".webp")}`,
  label,
});

export const eventMeta = {
  venue: "JW Marriott Phuket Resort & Spa",
  title: "JW Gala Garden Night — New Year's Eve Gala",
  date: "Thursday 31 December 2026",
  timing: "19:00 – 01:00 (6 hours)",
  guests: "200 adults + 30 children (~230 pax)",
  theme: "JW Gala Garden Night — Emerald & Gold, garden-in-bloom",
  spaces: "Ballroom (dinner + shows) → Lobby Pond (countdown finale)",
  concept:
    "The night is built as a single climbing arc rather than a front-loaded party that sags during the buffet. Energy rises through four deliberate summits — Arrival wow → Show 1 → Show 2 → the Midnight Summit — with a warm live baseline between them so it never flatlines.",
};

export const runOfShow: Beat[] = [
  {
    id: "welcome",
    time: "19:00",
    durationMin: 45,
    segment: "Garden Welcome + Champagne Ladies",
    location: "Pre-function / JW Garden entrance",
    energy: 2,
    what: "Doors open. Champagne Ladies (floral champagne-skirt hostesses) serve welcome bubbles; roaming living-statue garden performers; signature photo moment under the JW Garden arch. Ambient acoustic duo. Kids receive glow/garden favour.",
    lead: "MC (soft) + Ops",
    linkedActs: ["butterfly", "stilt"],
    media: { photo: "/acts/44_Butterfly Girl.webp" },
    gallery: [
      vid("welcome-vibe.mp4", "Welcome & ballroom vibe"),
      vid("entrance.mp4", "Guest entrance"),
      img("entrance-venue.webp", "Entrance styling"),
    ],
    links: [{ label: "MC Able (host)", url: "https://linktr.ee/wanamakok" }],
  },
  {
    id: "reveal",
    time: "19:45",
    durationMin: 15,
    segment: "The Reveal — Ballroom opens",
    location: "Move to Ballroom",
    energy: 4,
    what: "MC gathers the room. Ballroom doors open to a lighting sting + short band fanfare; guests step into the botanical room. First 'wow.' Ushers guide to tables.",
    lead: "MC + LX + Band",
    gallery: [
      img("venue-decor.webp", "Ballroom decor"),
      vid("venue-moodtone.mp4", "Venue vibe moodtone"),
    ],
  },
  {
    id: "show1",
    time: "20:00",
    durationMin: 20,
    segment: "Welcome + SHOW 1 — LED Butterfly Ballet",
    location: "Ballroom stage",
    energy: 6,
    peak: "peak1",
    what: "Luminous opener while guests are fresh: LED butterfly-wing ballet ensemble. MC officially welcomes, GM toast, buffet invitation.",
    lead: "Stage Mgr / Act 1",
    linkedActs: ["led-wing"],
    media: { photo: "/acts/41_LED Wing Girl.webp" },
    gallery: [
      vid("led-butterfly.mp4", "LED butterfly dance"),
      vid("butterfly-drone.mp4", "Butterfly drone show"),
      img("led-butterfly.webp", "LED butterfly ballet"),
    ],
  },
  {
    id: "buffet1",
    time: "20:20",
    durationMin: 50,
    segment: "Buffet Round 1",
    location: "Ballroom",
    energy: 3,
    what: "Full band live sets; DJ underscore on transitions. Strolling magician / close-up act works tables so dining never goes silent.",
    lead: "Band + DJ + F&B",
    gallery: [
      img("food-1.webp", "Buffet"),
      img("food-2.webp", "Buffet"),
      img("food-3.webp", "Buffet"),
      img("food-4.webp", "Buffet"),
      img("food-5.webp", "Buffet"),
      img("food-7.webp", "Buffet"),
      img("food-9.webp", "Buffet"),
      img("food-11.webp", "Buffet"),
      vid("nye-food-6.mp4", "Live station"),
      vid("nye-food-15.mp4", "Live station"),
      vid("nye-food-19.mp4", "Live station"),
    ],
  },
  {
    id: "kids-countdown",
    time: "21:00",
    durationMin: 10,
    segment: "Kids' Mini-Countdown",
    location: "Ballroom floor",
    energy: 5,
    what: "Early 'fake countdown' confetti pop for families with young children — gives them a midnight moment before bedtime. Quick, playful, MC-led.",
    lead: "MC + Ops",
  },
  {
    id: "show2",
    time: "21:10",
    durationMin: 25,
    segment: "SHOW 2 — Giant Illuminated Skirt",
    location: "Ballroom stage",
    energy: 7,
    peak: "peak2",
    what: "Mid-dinner spectacle to re-lift the room after they've eaten: the giant illuminated blooming-skirt reveal with dancers — a garden coming to light.",
    lead: "Stage Mgr / Act 2",
    linkedActs: ["giant-skirt"],
    media: { photo: "/acts/39_Giant Skirt.webp" },
    gallery: [
      vid("giant-skirt.mp4", "Giant illuminated skirt reveal"),
      img("giant-skirt-1.webp", "Giant skirt"),
      img("giant-skirt-2.webp", "Giant skirt"),
      img("giant-skirt-3.webp", "Giant skirt"),
      img("giant-skirt-4.webp", "Giant skirt"),
    ],
  },
  {
    id: "buffet2",
    time: "21:35",
    durationMin: 45,
    segment: "Buffet Round 2 + Band",
    location: "Ballroom",
    energy: 4,
    what: "Band shifts to up-tempo, dance-floor-warming sets. Floor opened early for eager dancers. Lucky Draw #1 (~21:50) holds attention.",
    lead: "Band + MC",
  },
  {
    id: "show3",
    time: "22:20",
    durationMin: 25,
    segment: "SHOW 3 — GOLDEN BLOOM (Finale)",
    location: "Ballroom stage → floor",
    energy: 8,
    peak: "peak3",
    what: "Live band + gold/emerald LED dancers fused into one number; the garden bursts into gold and floods the dance floor. Last note becomes the first DJ track — zero reset.",
    lead: "Stage Mgr / Act 3 + Band",
    linkedActs: ["led-dance", "giant-skirt"],
    media: { photo: "/finale/finale_B_golden_bloom_band_fusion.webp" },
    gallery: [vid("finale.mp4", "Finale show (last year)")],
  },
  {
    id: "dance-floor",
    time: "22:45",
    durationMin: 55,
    segment: "Dance Floor / DJ + Band",
    location: "Ballroom",
    energy: 8,
    what: "Party is live — DJ and band trade energy. MC hype. Lucky Draw Grand Prize (~23:15) keeps the room full ahead of the move outside.",
    lead: "DJ + Band + MC",
    links: [
      { label: "FineDay Band — live", url: "https://www.youtube.com/watch?v=CtS7_ojQjIA" },
      { label: "FineDay Band — set 2", url: "https://www.youtube.com/watch?v=dA_QTxWs3hw" },
    ],
  },
  {
    id: "procession",
    time: "23:40",
    durationMin: 10,
    segment: "Procession to the Pond",
    location: "Ballroom → Lobby Pond",
    energy: 6,
    what: "MC leads a sparkler / lantern-lined walk out; sparkling wine passed en route. The transition itself becomes a moment — no lull.",
    lead: "MC + Ops + F&B",
  },
  {
    id: "countdown",
    time: "23:50",
    durationMin: 10,
    segment: "COUNTDOWN at the Pond",
    location: "Lobby Pond",
    energy: 10,
    peak: "summit",
    what: "Live band countdown build. Guest LED wristbands / mass sparkler light-up. MC 10-second countdown → fireworks / pyro over the pond at 00:00. Confetti + anthem drop.",
    lead: "MC + Pyro + LX + Band",
    media: { photo: "/acts/72_LED Water Drum.webp" },
  },
  {
    id: "afterglow",
    time: "00:00",
    durationMin: 60,
    segment: "New Year Afterglow",
    location: "Poolside / Pond deck",
    energy: 5,
    what: "DJ after-party, late-night bites station, 'first hour of the year' signature cocktail. Energy winds down naturally to close at 01:00.",
    lead: "DJ + F&B",
  },
];

export const whySpacingWorks = [
  {
    title: "Show 1 early",
    body: "Guests are most alert when seated and hungry — so the opener lands early, at full attention.",
  },
  {
    title: "Protect the dip",
    body: "20:20–21:10 is the danger zone (heads down, eating). The live band + strolling act keep it from going flat.",
  },
  {
    title: "Show 2 mid-dinner",
    body: "Placed right after the meal to pull heads up and re-lift the room.",
  },
  {
    title: "Show 3 into the floor",
    body: "Hands straight into the DJ / dance floor — no reset before the march to midnight.",
  },
  {
    title: "Pond finale",
    body: "The 10-minute procession + countdown is the emotional payoff; the afterglow lets it breathe instead of a hard stop.",
  },
];
