// Golden Bloom finale — creative-brief data + the 4 generated concept boards.

export const goldenBloom = {
  title: "GOLDEN BLOOM",
  subtitle: "Finale production number · NYE 31 December 2026",
  placement: "Finale, ~22:20 — the third and biggest of 3 show sets",
  duration: "20–25 minutes, continuous",
  palette: "Emerald green → gold; botanical / garden-in-bloom",
  concept:
    "The moment the garden bursts into gold. A single building production number that fuses the full band with gold-and-emerald LED dancers and floods the room with light, sound and movement. Engineered to end the room STANDING and dancing — the last note becomes the first DJ track, zero reset before the midnight procession.",
  beats: [
    {
      name: "Bud",
      window: "0–3 min",
      body: "Low, warm garden state. Band intro, single vocal or instrument; a few LED dancers 'grow' in from darkness in emerald tones.",
    },
    {
      name: "Bloom",
      window: "3–9 min",
      body: "Tempo lifts; gold LED costumes activate; ensemble fills the stage; light beams and gobos open across the room.",
    },
    {
      name: "Full Bloom",
      window: "9–16 min",
      body: "Full band + full cast at peak; gold confetti / streamers; dancers move off-stage onto the floor; MC energises the room.",
    },
    {
      name: "Overflow",
      window: "16–22 min",
      body: "Dancers pull guests up; the number dissolves into an open dance-floor groove; band + DJ crossfade — the act becomes the party.",
    },
  ],
  successCriteria: [
    "The room ends STANDING and dancing.",
    "Continuous build — no flat middle; one rising arc.",
    "Seamless live-band → DJ handoff, zero dead air.",
    "Clearly bigger and warmer than the two earlier acts; on-theme gold-and-green garden.",
    "Reads as a shared celebration, not a watch-only stage act.",
  ],
};

export interface FinaleConcept {
  id: string;
  label: string;
  title: string;
  image: string;
  pitch: string;
}

export const finaleConcepts: FinaleConcept[] = [
  {
    id: "A",
    label: "Concept A",
    title: "Secret Garden Bloom",
    image: "/finale/finale_A_secret_garden_bloom.webp",
    pitch:
      "Botanical reveal — the stage 'grows' as emerald dancers emerge and the room blooms into gold. Elegant, on-theme, lowest technical risk.",
  },
  {
    id: "B",
    label: "Concept B",
    title: "Golden Bloom Band Fusion",
    image: "/finale/finale_B_golden_bloom_band_fusion.webp",
    pitch:
      "The brief's core: live band and gold/emerald LED dancers fully integrated in one continuous number that hands straight to the DJ. The recommended lead concept.",
  },
  {
    id: "C",
    label: "Concept C",
    title: "Garden of Fire & Light",
    image: "/finale/finale_C_garden_of_fire_light.webp",
    pitch:
      "Highest spectacle — cold-spark / pyro accents and LED water-drum energy for maximum peak. Needs venue fire sign-off and the biggest budget.",
  },
  {
    id: "D",
    label: "Concept D",
    title: "Aerial Flower Descends",
    image: "/finale/finale_D_aerial_flower_descends.webp",
    pitch:
      "A signature aerial moment — a blooming flower descends over the floor. Distinct 'wow' visual; requires confirmed ballroom rigging load.",
  },
];

// Production risk board — from the run-of-show technical notes.
export interface RiskItem {
  area: string;
  note: string;
  status: "confirm" | "watch" | "ok";
}

export const riskBoard: RiskItem[] = [
  {
    area: "Pyro / Fireworks permits",
    note: "Resort + local permits for shoreline/barge firing over the pond. Wind call + fire marshal on standby. Backup: cold sparklers / CO2.",
    status: "confirm",
  },
  {
    area: "Ballroom rigging load",
    note: "Confirm ceiling load + rigging points before locking aerial acts (Silk Acrobat, Aerial Flower finale).",
    status: "confirm",
  },
  {
    area: "LED costume power",
    note: "Battery runtime must cover a 25-min finale + hold; charging/power backstage.",
    status: "watch",
  },
  {
    area: "Band ↔ DJ handoff",
    note: "Shared stage system with a clean handoff matrix; agree the exact crossover track in advance.",
    status: "watch",
  },
  {
    area: "Pond PA + generator",
    note: "Second smaller PA pre-rigged at the Lobby Pond for the countdown; own rig + generator.",
    status: "confirm",
  },
  {
    area: "Guest LED wristbands",
    note: "DMX-triggered to flash on the countdown beat — distributed at ballroom entry. Sparkler alternative as low-tech backup.",
    status: "ok",
  },
];
