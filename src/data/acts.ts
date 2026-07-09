// The entertainment catalogue — 40 distinct acts derived from the PHOENIX ORGANIZE
// show deck. Energy is a 1–10 score (mapped from the Low → Very High scale in the
// original catalogue) so the vibe graph can plot a smooth momentum curve.
// Costs are INDICATIVE PLACEHOLDERS in THB — edit them in the Revenue module.

export type ThemeKey =
  | "thai"
  | "garden"
  | "chinese"
  | "led"
  | "indian"
  | "cabaret"
  | "circus"
  | "interactive";

export type Placement = "welcome" | "opening" | "mid" | "finale";

// "show" = a performance act — has energy + can be slotted into the night.
// "decor" = a decor/element item — no energy, no slot placement, catalog only.
export type ItemKind = "show" | "decor";

export interface Act {
  id: string;
  name: string;
  type: string;
  description: string;
  kind: ItemKind;
  energy?: number; // 1–10 — shows only
  energyLabel?: string; // shows only
  placement?: Placement[]; // shows only
  themes: ThemeKey[];
  requiresDark: boolean;
  durationMin: number; // typical stage time
  costTHB: number; // indicative placeholder
  photo: string; // primary
  photos: string[]; // gallery
  custom?: boolean; // true if user-added via the builder (not the source catalogue)
  overridden?: boolean; // true if this is a built-in act patched via the builder
}

// Shape submitted from the "add new item" form before an id is assigned.
export interface NewActInput {
  name: string;
  type: string;
  description: string;
  kind: ItemKind;
  themes: ThemeKey[];
  requiresDark: boolean;
  durationMin: number;
  costTHB: number;
  photo?: string;
  energy?: number; // required for kind "show"
  placement?: Placement[]; // required for kind "show"
}

const p = (n: number, title: string) =>
  `/acts/${String(n).padStart(2, "0")}_${title}.webp`;

// Self-contained placeholder so a custom item with no photo never 404s.
const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#182620"/><text x="50%" y="50%" fill="#5b7268" font-family="sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle">No photo</text></svg>`;
export const PLACEHOLDER_PHOTO = `data:image/svg+xml;utf8,${encodeURIComponent(
  placeholderSvg
)}`;

export function energyLabelFor(n: number): string {
  if (n <= 3) return "Low";
  if (n <= 5) return "Medium";
  if (n <= 8) return "High";
  return "Very High";
}

export const THEME_LABELS: Record<ThemeKey, string> = {
  thai: "Thai Cultural",
  garden: "Garden Botanical",
  chinese: "Chinese Auspicious",
  led: "LED / Modern",
  indian: "Indian & World",
  cabaret: "Cabaret / Western",
  circus: "Circus / Spectacle",
  interactive: "Interactive",
};

export const PLACEMENT_LABELS: Record<Placement, string> = {
  welcome: "Welcome",
  opening: "Opening",
  mid: "Mid-stage",
  finale: "Finale",
};

const catalogRaw: Omit<Act, "kind">[] = [
  {
    id: "thai-traditional",
    name: "Thai Traditional Dance",
    type: "Traditional Thai",
    description:
      "Classical Thai dance in gold-and-jewel-tone costumes, slow hand and finger articulation, group formation.",
    energy: 2,
    energyLabel: "Low",
    placement: ["welcome", "opening"],
    themes: ["thai"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 55000,
    photo: p(3, "Thai Traditional Dance"),
    photos: [3, 4, 5, 6, 7].map((n) => p(n, "Thai Traditional Dance")),
  },
  {
    id: "thai-contemporary",
    name: "Thai Contemporary Dance",
    type: "Thai fusion",
    description:
      "Modernised take on Thai dance vocabulary — faster tempo and more staging movement than the classical style.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["opening", "mid"],
    themes: ["thai"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 60000,
    photo: p(8, "Thai Contemporary Dance"),
    photos: [8, 9, 10, 11, 12, 13].map((n) => p(n, "Thai Contemporary Dance")),
  },
  {
    id: "kinnaree",
    name: "Kinnaree",
    type: "Traditional Thai (mythical)",
    description:
      "Dancers costumed as half-bird, half-woman mythical figures with large wing pieces and slow ceremonial movement.",
    energy: 3,
    energyLabel: "Low-Medium",
    placement: ["opening"],
    themes: ["thai", "garden"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 65000,
    photo: p(14, "Kinnaree"),
    photos: [14, 15].map((n) => p(n, "Kinnaree")),
  },
  {
    id: "shadow-play",
    name: "Nang Talung / Shadow Play",
    type: "Traditional folk (puppetry)",
    description:
      "Thai shadow puppet performance — silhouette figures against a lit screen, narrative-driven and calm.",
    energy: 2,
    energyLabel: "Low",
    placement: ["mid"],
    themes: ["thai"],
    requiresDark: true,
    durationMin: 10,
    costTHB: 40000,
    photo: p(17, "Shadow Play"),
    photos: [p(16, "Nang Talung"), ...[17, 18, 19].map((n) => p(n, "Shadow Play"))],
  },
  {
    id: "100-hands",
    name: "100 Hands",
    type: "Cultural ensemble dance",
    description:
      "Large synchronised group dance built around uniform hand and fan gestures for visual scale.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["opening", "mid"],
    themes: ["circus", "thai"],
    requiresDark: false,
    durationMin: 10,
    costTHB: 85000,
    photo: p(20, "100 Hands"),
    photos: [p(20, "100 Hands")],
  },
  {
    id: "broadway",
    name: "Broadway Dance",
    type: "Western cabaret",
    description:
      "Sequinned and feathered showgirl-style dance number with Western stage choreography.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid"],
    themes: ["cabaret"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 70000,
    photo: p(21, "Broadway Dance"),
    photos: [p(21, "Broadway Dance")],
  },
  {
    id: "gatsby",
    name: "Gatsby Girl",
    type: "Themed / retro",
    description: "1920s flapper-styled dance act with Gatsby costuming and jazz-age styling.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["mid"],
    themes: ["cabaret"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 45000,
    photo: p(22, "Gatsby Girl"),
    photos: [p(22, "Gatsby Girl")],
  },
  {
    id: "candle",
    name: "Candle Dance",
    type: "Traditional Thai",
    description:
      "Slow, formation-based dance performed holding lit candles; visually calm and controlled.",
    energy: 2,
    energyLabel: "Low",
    placement: ["welcome", "mid"],
    themes: ["thai", "garden"],
    requiresDark: true,
    durationMin: 7,
    costTHB: 45000,
    photo: p(23, "Candle Dance"),
    photos: [23, 24].map((n) => p(n, "Candle Dance")),
  },
  {
    id: "rajasthan",
    name: "Rajasthan Dance",
    type: "Cultural (Indian)",
    description: "Rajasthani folk dance — colourful skirted costumes and spinning formations.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["mid"],
    themes: ["indian"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 50000,
    photo: p(25, "Rajasthan Dance"),
    photos: [p(25, "Rajasthan Dance")],
  },
  {
    id: "belly",
    name: "Belly Dance",
    type: "Cultural (Middle Eastern)",
    description:
      "Solo or small-group belly dance — isolation-based movement with coin and veil costuming.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["mid"],
    themes: ["indian"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 40000,
    photo: p(26, "Belly Dance"),
    photos: [p(26, "Belly Dance")],
  },
  {
    id: "bollywood",
    name: "Bollywood Dance",
    type: "Cultural (Indian)",
    description: "Upbeat Bollywood-style group dance with bright costumes and fast choreography.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid"],
    themes: ["indian"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 60000,
    photo: p(27, "Bollywood Dance"),
    photos: [27, 28, 29].map((n) => p(n, "Bollywood Dance")),
  },
  {
    id: "bohemian",
    name: "Bohemian Dance",
    type: "Themed / folk",
    description:
      "Free-flowing gypsy/bohemian-styled dance with loose costuming and a less rigid formation.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["mid"],
    themes: ["indian"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 42000,
    photo: p(30, "Bohemian Dance"),
    photos: [p(30, "Bohemian Dance")],
  },
  {
    id: "zorb",
    name: "Girl in Zorb Ball",
    type: "Novelty / specialty",
    description:
      "Performer inside an inflatable sphere, rolled or walked through the venue as a visual novelty.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["welcome"],
    themes: ["interactive", "circus"],
    requiresDark: false,
    durationMin: 20,
    costTHB: 38000,
    photo: p(31, "Girl in Zorb Ball"),
    photos: [p(31, "Girl in Zorb Ball")],
  },
  {
    id: "sufi",
    name: "Sufi Dance",
    type: "Cultural / spiritual",
    description: "Whirling-dervish-style continuous spinning dance — hypnotic and repetitive.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["mid"],
    themes: ["indian"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 45000,
    photo: p(32, "Sufi Dance"),
    photos: [p(32, "Sufi Dance")],
  },
  {
    id: "feather",
    name: "Feather Dance",
    type: "Western cabaret",
    description: "Showgirl act built around large feather fans and backpieces.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["mid"],
    themes: ["cabaret", "garden"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 48000,
    photo: p(33, "Feather Dance"),
    photos: [p(33, "Feather Dance")],
  },
  {
    id: "fan",
    name: "Fan Dance",
    type: "Cultural",
    description: "Group or solo dance using fans as the primary visual prop.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["welcome", "mid"],
    themes: ["thai", "garden"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 45000,
    photo: p(34, "Fan Dance"),
    photos: [p(34, "Fan Dance")],
  },
  {
    id: "lakshmi",
    name: "Lakshmi Dance",
    type: "Cultural (Indian, deity-themed)",
    description: "Dance styled around the Hindu goddess Lakshmi with ornate gold costuming.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["mid"],
    themes: ["indian"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 55000,
    photo: p(35, "Lakshmi Dance"),
    photos: [35, 36, 37, 38].map((n) => p(n, "Lakshmi Dance")),
  },
  {
    id: "giant-skirt",
    name: "Giant Illuminated Skirt",
    type: "Novelty / costume spectacle",
    description:
      "Performer in an oversized illuminated skirt used as a moving, blooming visual centrepiece.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["mid", "finale"],
    themes: ["garden", "led"],
    requiresDark: true,
    durationMin: 12,
    costTHB: 95000,
    photo: p(39, "Giant Skirt"),
    photos: [39, 40].map((n) => p(n, "Giant Skirt")),
  },
  {
    id: "led-wing",
    name: "LED Wing Girl",
    type: "LED / light show",
    description: "Performer in an illuminated wing costume; reads best in darkness or low light.",
    energy: 7,
    energyLabel: "High",
    placement: ["mid", "finale"],
    themes: ["led", "garden"],
    requiresDark: true,
    durationMin: 7,
    costTHB: 55000,
    photo: p(41, "LED Wing Girl"),
    photos: [p(41, "LED Wing Girl")],
  },
  {
    id: "led-dance",
    name: "LED Dance",
    type: "LED / light show",
    description: "Group dance in LED-lined costumes, choreographed for a dark room.",
    energy: 8,
    energyLabel: "High",
    placement: ["finale"],
    themes: ["led"],
    requiresDark: true,
    durationMin: 9,
    costTHB: 90000,
    photo: p(42, "LED Dance"),
    photos: [p(42, "LED Dance")],
  },
  {
    id: "led-poi",
    name: "LED Poi",
    type: "LED / light show",
    description: "Poi-spinning act using LED light trails instead of fire.",
    energy: 8,
    energyLabel: "High",
    placement: ["finale"],
    themes: ["led"],
    requiresDark: true,
    durationMin: 6,
    costTHB: 45000,
    photo: p(43, "LED Poi"),
    photos: [p(43, "LED Poi")],
  },
  {
    id: "butterfly",
    name: "Butterfly Girl",
    type: "Novelty / costume",
    description: "Costume act with large butterfly wing pieces — mostly visual and photo-driven.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["welcome", "mid"],
    themes: ["garden"],
    requiresDark: false,
    durationMin: 15,
    costTHB: 35000,
    photo: p(44, "Butterfly Girl"),
    photos: [p(44, "Butterfly Girl")],
  },
  {
    id: "stilt",
    name: "Stilt Walker",
    type: "Circus / novelty",
    description: "Performers on stilts who roam the venue rather than perform on a fixed stage.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["welcome"],
    themes: ["circus", "interactive"],
    requiresDark: false,
    durationMin: 30,
    costTHB: 40000,
    photo: p(45, "Stilt Walker"),
    photos: [45, 46].map((n) => p(n, "Stilt Walker")),
  },
  {
    id: "taiko",
    name: "Taiko Drum",
    type: "Cultural (Japanese) / percussion",
    description:
      "Group taiko drumming — heavy percussive hits and a physically forceful performance.",
    energy: 8,
    energyLabel: "High",
    placement: ["opening", "mid"],
    themes: ["circus"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 90000,
    photo: p(47, "Taiko Drum"),
    photos: [47, 48].map((n) => p(n, "Taiko Drum")),
  },
  {
    id: "mirror",
    name: "Mirror Dance",
    type: "Novelty / visual",
    description: "Dancers with mirrored costume elements reflecting stage lighting.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["mid"],
    themes: ["led"],
    requiresDark: true,
    durationMin: 7,
    costTHB: 55000,
    photo: p(49, "Mirror Dance"),
    photos: [49, 50].map((n) => p(n, "Mirror Dance")),
  },
  {
    id: "silk-acrobat",
    name: "Silk Acrobat",
    type: "Circus / aerial",
    description: "Aerial silk act — climbing and dropping sequences; requires overhead rigging.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["mid"],
    themes: ["circus"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 65000,
    photo: p(51, "Silk Acrobat"),
    photos: [p(51, "Silk Acrobat")],
  },
  {
    id: "acrobat",
    name: "Acrobat",
    type: "Circus",
    description: "Floor-based acrobatics, balance and contortion act.",
    energy: 6,
    energyLabel: "Medium-High",
    placement: ["mid"],
    themes: ["circus"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 60000,
    photo: p(52, "Acrobat"),
    photos: [52, 53, 54].map((n) => p(n, "Acrobat")),
  },
  {
    id: "chang-mask",
    name: "Chinese Chang Mask",
    type: "Traditional Chinese",
    description:
      "Face-changing (Bian Lian) act — masks swapped instantly as the signature trick.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["mid"],
    themes: ["chinese"],
    requiresDark: false,
    durationMin: 7,
    costTHB: 70000,
    photo: p(55, "Chinese Chang Mask"),
    photos: [p(55, "Chinese Chang Mask")],
  },
  {
    id: "flash-mob",
    name: "Flash Mob Dance",
    type: "Modern / interactive",
    description:
      "Performers seeded among guests who suddenly break into a synchronised pop dance.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid", "finale"],
    themes: ["interactive"],
    requiresDark: false,
    durationMin: 6,
    costTHB: 55000,
    photo: p(56, "Flash Mob Dance"),
    photos: [p(56, "Flash Mob Dance")],
  },
  {
    id: "tiffany",
    name: "Tiffany Show",
    type: "Cabaret",
    description:
      "Cabaret-style transformation show with elaborate costume changes and lip-sync numbers.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid"],
    themes: ["cabaret"],
    requiresDark: false,
    durationMin: 12,
    costTHB: 110000,
    photo: p(57, "Tiffany Show"),
    photos: [57, 58, 59].map((n) => p(n, "Tiffany Show")),
  },
  {
    id: "drummy-funny",
    name: "Drummy Funny Show",
    type: "Comedy / percussion",
    description:
      "Comedic drum act mixing percussion with slapstick audience interaction.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid"],
    themes: ["circus", "interactive"],
    requiresDark: false,
    durationMin: 12,
    costTHB: 85000,
    photo: p(60, "Drummy Funny Show"),
    photos: [p(60, "Drummy Funny Show")],
  },
  {
    id: "dragon",
    name: "Dragon Dance",
    type: "Traditional Chinese",
    description:
      "Long dragon puppet carried by a team in an undulating movement routine — auspicious.",
    energy: 8,
    energyLabel: "High",
    placement: ["opening", "finale"],
    themes: ["chinese"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 90000,
    photo: p(61, "Dragon Dance"),
    photos: [p(61, "Dragon Dance")],
  },
  {
    id: "led-dragon",
    name: "LED Dragon Dance",
    type: "Traditional Chinese + LED",
    description:
      "The dragon dance format rebuilt with an LED-lit dragon for a night or dark setting.",
    energy: 9,
    energyLabel: "High",
    placement: ["finale"],
    themes: ["chinese", "led"],
    requiresDark: true,
    durationMin: 8,
    costTHB: 120000,
    photo: p(62, "LED Dragon Dance"),
    photos: [p(62, "LED Dragon Dance")],
  },
  {
    id: "lion",
    name: "Lion Dance",
    type: "Traditional Chinese",
    description:
      "Two-person lion costume act, percussion-driven and traditionally auspicious for openings.",
    energy: 8,
    energyLabel: "High",
    placement: ["opening"],
    themes: ["chinese"],
    requiresDark: false,
    durationMin: 8,
    costTHB: 75000,
    photo: p(63, "Lion Dance"),
    photos: [p(63, "Lion Dance")],
  },
  {
    id: "muay-thai",
    name: "Muay Thai",
    type: "Traditional Thai martial art",
    description: "Choreographed Muay Thai demonstration and sparring routine.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid"],
    themes: ["thai"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 65000,
    photo: p(64, "Muay Thai"),
    photos: [p(64, "Muay Thai")],
  },
  {
    id: "sabudchai",
    name: "Sabudchai",
    type: "Traditional Thai",
    description:
      "Northeastern Thai ensemble with drums, gongs and folk dance pairing.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["welcome", "mid"],
    themes: ["thai"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 60000,
    photo: p(65, "Sabudchai"),
    photos: [p(65, "Sabudchai")],
  },
  {
    id: "bamboo",
    name: "Thai Bamboo Dance",
    type: "Traditional Southeast Asian",
    description:
      "Tinikling-style dance stepping between clapping bamboo poles; commonly invites guest participation.",
    energy: 5,
    energyLabel: "Medium",
    placement: ["welcome", "mid"],
    themes: ["thai", "interactive"],
    requiresDark: false,
    durationMin: 10,
    costTHB: 55000,
    photo: p(66, "Thai Bamboo Dance"),
    photos: [66, 67, 68, 69].map((n) => p(n, "Thai Bamboo Dance")),
  },
  {
    id: "kung-fu",
    name: "Kung Fu Show",
    type: "Traditional Chinese martial art",
    description: "Shaolin-style kung fu demonstration with weapons and stance routines.",
    energy: 8,
    energyLabel: "High",
    placement: ["mid"],
    themes: ["chinese"],
    requiresDark: false,
    durationMin: 9,
    costTHB: 70000,
    photo: p(70, "Kung Fu Show"),
    photos: [p(70, "Kung Fu Show")],
  },
  {
    id: "uv-show",
    name: "UV Show",
    type: "LED / blacklight",
    description:
      "Full UV-reactive costume dance that glows under blacklight — high visual contrast.",
    energy: 8,
    energyLabel: "High",
    placement: ["finale"],
    themes: ["led"],
    requiresDark: true,
    durationMin: 10,
    costTHB: 100000,
    photo: p(71, "UV Show"),
    photos: [p(71, "UV Show")],
  },
  {
    id: "led-water-drum",
    name: "LED Water Drum",
    type: "LED / percussion spectacle",
    description:
      "Drummers in illuminated costumes striking water-filled drums with fire elements behind — the biggest finale piece.",
    energy: 10,
    energyLabel: "Very High",
    placement: ["finale"],
    themes: ["led", "circus"],
    requiresDark: true,
    durationMin: 12,
    costTHB: 160000,
    photo: p(72, "LED Water Drum"),
    photos: [p(72, "LED Water Drum")],
  },
];

export const acts: Act[] = catalogRaw.map((a) => ({ ...a, kind: "show" as const }));

export const actById = (id: string) => acts.find((a) => a.id === id);

// Combined lookup across the built-in catalogue and any user-added custom
// acts/decor items. `custom` entries flagged `overridden` patch a built-in
// act with the same id (edits from the builder); everything else is a fresh
// user-added item, appended after the (possibly patched) catalogue.
export function findAct(id: string, custom: Act[] = []): Act | undefined {
  const fromCustom = custom.find((a) => a.id === id);
  if (fromCustom) return fromCustom;
  return acts.find((a) => a.id === id);
}

export function allActsList(custom: Act[] = []): Act[] {
  const overrides = new Map(
    custom.filter((a) => a.overridden).map((a) => [a.id, a])
  );
  const fresh = custom.filter((a) => !a.overridden);
  const merged = acts.map((a) => overrides.get(a.id) ?? a);
  return [...merged, ...fresh];
}
