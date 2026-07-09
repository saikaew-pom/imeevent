# JW Gala Garden Night — Event Command Deck

An interactive planning + pitch dashboard for the JW Marriott Phuket New Year's Eve
gala. Built with Next.js 16, TypeScript, Tailwind v4 and Zustand.

## Modules

- **Overview** (`/`) — event snapshot + concept.
- **Event Flow** (`/flow`) — the run of show as a live energy curve. Click any beat
  for cues, linked show photos and a YouTube/Vimeo reference-video slot. Planner /
  client view toggle.
- **Entertainment Builder** (`/builder`) — pick from all 40 acts into Welcome /
  Opening / Mid / Finale slots. The vibe curve redraws live and flags anti-patterns
  (finale not the peak, adjacent low-energy acts, LED act in daylight, flat arc). A
  preset engine builds a rising-curve lineup from theme + vibe + number of shows.
- **Revenue** (`/revenue`) — P&L with editable assumptions. The lineup's talent cost
  feeds in automatically. Waterfall, margin, break-even, what-if sliders, and A/B/C
  scenario compare.
- **Finale** (`/finale`) — the Golden Bloom creative brief, four concept boards, and
  the production risk board.
- **Present** (`/present`) — a full-screen, keyboard-navigable pitch deck (←/→/space)
  generated live from the lineup and revenue model.

State (lineup, assumptions, attached videos) persists in `localStorage`.

## Data

Everything is typed data under `src/data/`:

- `acts.ts` — the 40-act catalogue (energy, themes, placement, indicative cost).
- `runOfShow.ts` — the JW timeline / four-peaks curve.
- `financials.ts` — revenue & cost assumptions (placeholders, editable in the UI).
- `presets.ts` — the lineup-suggestion engine.
- `finale.ts` — Golden Bloom brief, concept boards, risk board.

> Cost figures are **indicative placeholders**. Only guest count and average check
> come from the brief — replace the rest with real vendor quotes in the Revenue module.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy (GitHub + Vercel)

```bash
# from this folder (a git repo already exists here)
git add -A && git commit -m "Event command deck"
gh repo create jw-gala-deck --private --source=. --push   # needs gh auth
```

Then import the repo at [vercel.com/new](https://vercel.com/new) — no environment
variables or build config needed; Vercel auto-detects Next.js.

**Note on image weight:** `public/acts/` holds ~100 MB of show photos. That deploys
fine on Vercel, but for faster loads you may want to compress them (e.g. to WebP)
before going live.
