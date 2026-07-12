# EventFlow Production — Build Plan

Live at `https://imeevent.pskspace.workers.dev`. Next.js 16 + Cloudflare Workers/D1/R2, Zustand store.
JW's project (`jw-gala-garden-night`, guest passcode `cheewitcheewa`) must stay byte-identical through every phase.

## Foundation build

- [x] ~~Scaffold Next.js app + theme~~
- [x] ~~Typed data layer~~
- [x] ~~Module 1: Event Flow timeline~~
- [x] ~~Module 2: Entertainment Builder~~
- [x] ~~Module 3: Revenue vs Costing simulator~~
- [x] ~~Module 4: Present mode + extras~~
- [x] ~~P&L history comparison + benchmarked simulation~~
- [x] ~~Tiered-package revenue model + 2026 Costing Deep Dive tab~~
- [x] ~~Custom acts + decor kind data model, CRUD, live energy calc~~
- [x] ~~SaaS landing page + passcode gate~~
- [x] ~~Migrate deploy target to Cloudflare Workers (OpenNext) + D1 schema~~
- [x] ~~Auth system (admin-invite only) + admin user/project management~~
- [x] ~~Project passcode for instant guest access~~
- [x] ~~Act photo overrides: R2 upload, edit/reset any catalogue item~~
- [x] ~~Shared project state (lineup/program/financials) synced via D1, viewer read-only enforcement~~
- [x] ~~MiniMax AI integration (text + image gen) wired as Cloudflare secret~~
- [x] ~~AI presentation slides: generate/edit + PDF export~~
- [x] ~~Project tasks: checklist + Gantt timeline view~~
- [x] ~~Timeline presets (5 presets, relative-offset import)~~
- [x] ~~Project documents: PDF text extraction, R2 upload, AI task suggestions from docs~~
- [x] ~~Media Library (Phase 1): media_assets table, MediaPicker, beat gallery/key-visual/ref-videos, `/media` tab~~
- [x] ~~Talent + inline-create (Phase 2): talent table, inline show/decor/talent creation from beat drawer~~
- [x] ~~AI content-assist (Phase 3): draft-with-AI on beat/item/talent fields, run-of-show AI review~~
- [x] ~~Static-slide AI generation wired into `/present`~~
- [x] ~~Event Flow UX: reorder/delete rows, drag-and-drop (dnd-kit), ActCard photo popup~~
- [x] ~~Media Library extras: link-type assets, AI-assisted media search~~
- [x] ~~Remove Finale route from nav (kept data file)~~

## Phase A — Currency + multi-day events

- [x] ~~A1: currency-aware `money()` + `CurrencyCode` registry, wired through revenue/costing/present/Waterfall/LineupPanel/ActLibrary/AI, currency picker~~
- [x] ~~A2: `Beat.day` field + multi-day rendering/add/move/drag in Event Flow~~
- [x] ~~Verified: JW figures byte-identical (THB), currency switch works, multi-day project renders correctly~~

## Phase B — Project templates wizard

- [x] ~~B1: `EventMeta.eventType` + `days` fields~~
- [x] ~~B2: incentive task preset~~
- [x] ~~B3: `projectTemplates.ts` registry~~
- [x] ~~B4: server action for template-based creation~~
- [x] ~~B5: `NewProjectWizard` client component~~
- [x] ~~B6: wire wizard into `/projects` page~~
- [x] ~~B7: verified~~

## Phase C — AI-assisted project generation

- [x] ~~C1: MiniMax `generateSlideCopy` token budget param~~
- [x] ~~C2: `aiHints` + AI overlay generation in `projectTemplates.ts`~~
- [x] ~~C3: `/api/builder/project/generate` route~~
- [x] ~~C4: server action accepts optional AI overlay~~
- [x] ~~C5: wizard UI — notes field + Generate/preview/accept flow~~
- [x] ~~C6: verified~~

## Phase D — Event-type vocabulary + per-day costing

- [x] ~~D1: genericize Finale slide fallback (JW exempted)~~
- [x] ~~D2: `Beat.audience`/`attire` fields + Event Flow chips~~
- [x] ~~D3: per-archetype vocabulary in dashboard/present/costing UI~~
- [x] ~~D4: `CostLine.day` + per-day spend breakdown in Costing~~
- [x] ~~D5: verified~~

## Phase E — JW data isolation fixes

- [x] ~~E1: fix blank-project JW-financials fallback~~
- [x] ~~E2: gate JW historical comparison to JW only~~
- [x] ~~E3: stop leaking JW's act catalogue to other projects~~
- [x] ~~E4: verified~~

## Phase F — Multi-tenant companies + archive/recycle bin

- [x] ~~F1: migration — `companies`/`company_members` + `projects.company_id`/`archived_at`~~
- [x] ~~F2: query layer — companies, scoped users/projects, archive/restore~~
- [x] ~~F3: gate archived projects + company-admin implicit owner in `ProjectLayout`~~
- [x] ~~F4: wire `company_id` into self-serve wizard project creation~~
- [x] ~~F5: admin dashboard rework — company sections, recycle bin~~
- [x] ~~F6: verified~~

**Shipped:** commit `a3861ec`, migration `0012_companies.sql` applied to production D1, deployed (Version ID `3e91ffe7-1f01-444b-bf83-1a05c94c2c00`). JW's live guest-passcode dashboard confirmed unaffected post-deploy.

## Phase G — Project duplication

- [x] ~~G1: query layer — `duplicateProject()` in `queries.ts` (custom_acts/talent/media/tasks/documents/project_state, talent-id remap in `program`)~~
- [x] ~~G2: server action — `duplicateProjectAction` (owner or company-admin/super-admin only)~~
- [x] ~~G3: UI — Duplicate control on `/projects` list~~
- [x] ~~G4: this file updated~~
- [x] ~~G5: verify locally (custom acts/talent-id remap/tasks/media/program all confirmed correct on a real duplicate; source project + JW untouched)~~
- [x] ~~G6: commit + deploy + verify in production~~

**Shipped:** commit `83aaccd`, no migration needed, deployed (Version ID `a38a9670-301a-45d0-be37-577ea2bbde47`). JW's live guest-passcode dashboard confirmed unaffected post-deploy.

## Phase H — AI theming

Scoped (per user decision) as an additive AI theme concept + palette, not a
full re-skin of the app's own fixed emerald/gold UI (~25+ components hardcode
that look with no per-project theme mechanism — swapping it would need a
structural refactor first, out of scope here).

- [x] ~~H1: data model (`src/data/theme.ts`) + server `generateEventTheme()` (hard 45s timeout, JSON validation) + `"aiTheme"` added to `STATE_KEYS` (no migration — `project_state.key` has no CHECK constraint)~~
- [x] ~~H2: API route — `POST /api/builder/theme/generate`~~
- [x] ~~H3: store wiring — `aiTheme` hydrate + `generateAITheme` action~~
- [x] ~~H4: UI — theme section in Event Settings (generate/regenerate + swatches) + conditional dashboard hero display (JW-safe: renders nothing without a saved theme)~~
- [x] ~~H5: this file updated~~
- [x] ~~H6: verified locally (real MiniMax generation, correct persistence/display in dashboard + settings modal, JW untouched) + committed + deployed + verified in production~~

**Shipped:** commit `634f39f`, no migration needed, deployed (Version ID `0116e337-93d1-46cd-abe1-56ec14562bec`). JW's live guest-passcode dashboard confirmed unaffected post-deploy.

## Phase I/J — Company Library (Media + Show & Decor, then Equipment Rental / Sound & Lighting / Airport Transfers / Tours & Activities)

Built as one combined pass since J is explicitly "the same library mechanism,
more categories." Architecture decisions (no existing precedent diverges, so
made without asking, stated here for the record):

- **Copy-on-use, not live-shared records.** Picking a library item into a
  project copies it into that project's own storage (new id, independently
  editable from then on) — matches every other reuse mechanism already built
  (act overrides, Phase G duplication). A live-synced shared record would be
  a different, riskier architecture with no precedent in this codebase.
- **Three new company-scoped tables**, mirroring existing project-scoped
  shapes so copying is a straight field-for-field insert:
  `company_library_media` (mirrors `media_assets`), `company_library_acts`
  (mirrors `custom_acts`, kind show/decor), `company_library_vendors` (new —
  one table with a `category` column for all four Phase J categories, since
  they're structurally identical: name/description/photo/cost/unit/vendor
  contact — four separate tables would just repeat the same schema).
- **Vendor items copy into a project as a `CostLine`** in Costing (not a new
  project-level table) — they're literally rentable/bookable line items with
  a cost, and Costing already has the exact shape. Category → cost group is
  fixed automatically: `equipment`/`sound-lighting` → `production`,
  `airport-transfers`/`tours-activities` → `others` (both already described
  as covering exactly this in `costStructure.ts`) — no new cost group needed.
- **Browsing is open to any company member; curating (add/edit/delete) is
  company-admin/super-admin only** — mirrors how the rest of the company
  tenancy layer already splits "member" vs "admin".
- **New self-serve `/library` page**, not folded into `/admin` — admin is
  oriented around user/project management and is already large; a page
  alongside `/projects` fits the "browse and copy into my project" workflow
  better. Scoped to the caller's own company via `getPrimaryCompanyId`,
  resolved server-side (never trusts a client-supplied `companyId`).
- **Not in scope for this pass:** picking a library item from *inside* the
  existing Media Library / Show & Decor Builder pages (i.e. a second entry
  point). The `/library` page's own "Copy to project" picker delivers the
  full value; wiring a reverse-direction browse-from-builder picker is a
  future enhancement, not required for the library to work end-to-end.

- [x] ~~L1: migration `0013_company_library.sql` — three tables above~~
- [x] ~~L2: query layer — list/create/update/delete for media/acts/vendors + `isCompanyMember` + copy-to-project functions (media→`media_assets`, acts→`custom_acts`, vendor→`financials.costLines`)~~
- [x] ~~L3: API routes — CRUD for all three item types + copy-to-project endpoints~~
- [x] ~~L4: UI — `/library` page (tabs: Media / Show & Decor / Vendors; admin-only add/edit/delete forms; copy-to-project picker for every member)~~
- [x] ~~L5: nav link to `/library`~~
- [x] ~~L6: this file updated~~
- [x] ~~L7: verified locally — added one media/act/vendor item, copied each into a test project (correct table/CostLine, correct cost-group mapping), confirmed independence (editing the library item didn't touch the project's copy), confirmed a non-admin member can browse/copy but gets 403 on add, confirmed JW untouched. All test data cleaned up by exact id.~~
- [x] ~~L8: committed + migration applied to production D1 + deployed + verified in production~~

**Shipped:** commit `80aea61`, migration `0013_company_library.sql` applied to production D1, deployed (Version ID `974cdf9d-ff56-4874-bc41-a5520fef15ca`). JW's live guest-passcode dashboard confirmed unaffected post-deploy.

## Phase T — App-wide light/dark theme switcher

The app had two separate hardcoded palettes: the gala dashboard (dark
emerald/gold, CSS-var driven) and the account surfaces — `/projects`,
`/admin`, `/library`, `/login`, the landing page (light "Notion" palette,
driven by plain JS hex constants in `notionTheme.ts`, not CSS vars).
Architecture decisions:

- **One shared `data-theme` attribute on `<html>`**, three effective states:
  absent (default — today's exact mixed look, dashboard dark + account
  light, unchanged), `"light"` (only overrides the dashboard's vars — the
  account surface is already light), `"dark"` (only overrides the new
  `--acct-*` vars — the dashboard is already dark). A user never has to
  return to "absent"; clicking the toggle always writes an explicit value.
  This guarantees JW-safety trivially: with no stored preference, nothing
  about her dashboard's CSS changes at all.
- **`notionTheme.ts`'s exports became CSS var references** (`var(--acct-*)`)
  instead of hardcoded hex — every one of the 7 files that already imported
  `ink`/`sub`/`border`/`hoverBg`/`danger` picked up the toggle for free, with
  zero changes to their own logic.
- **Found and fixed a real contrast trap before it shipped**: ~20 buttons
  across those files did `background: ink, color: "#fff"` — a solid dark
  button with hardcoded white text. `ink` also doubles as the flipping
  body-text color, so it must go light under dark mode — which would have
  made every one of those buttons' white text disappear into a now-light
  background. Introduced a separate `accentBg` token (fixed near-black,
  intentionally the same in both modes) for solid CTA fills instead, and
  fixed the mirror-image case (fixed-white pill + flipping `ink` text) found
  on the landing page's dark CTA band.
- **Left the ~30-50 scattered decorative/chart-specific hardcoded colors
  alone** (modal scrims, `GanttChart` category hues, energy-badge colors) —
  they already read fine in either mode (a semi-transparent black scrim
  works as an overlay regardless of base theme; arbitrary chart legend hues
  don't need to invert) and touching them wasn't needed for a coherent
  light/dark app.
- **No toggle button on `/login` or the landing page** — scope call, not a
  gap: those pages still fully respect a stored preference (same CSS vars),
  there just isn't a switcher control rendered on them; toggling from
  `/projects` or the dashboard is enough to set the whole app's mode before
  ever reaching those pages.

- [x] ~~T1: CSS variable system — `[data-theme="light"]` override for the dashboard's existing vars, new `--acct-*` vars (default light) + `[data-theme="dark"]` override, fixed `.chip`/`.nav-link:hover` tint vars~~
- [x] ~~T2: `notionTheme.ts` → CSS vars; introduced `accentBg` and fixed all ~20 `background: ink` button-fill occurrences~~
- [x] ~~T3: fixed remaining hardcoded `#ffffff` page backgrounds (`bg` export) across projects/admin/login/landing/library~~
- [x] ~~T4: `ThemeToggle` component + `beforeInteractive` pre-paint script in the root layout (no flash) + wired into `NavBar` and the projects/admin/library headers~~
- [x] ~~T5: this file updated~~
- [x] ~~T6: verified locally — computed CSS values for all 15 dashboard vars match the original hex exactly with no stored preference; round-trips correctly; light dashboard + dark account pages both coherent and legible~~
- [x] ~~T7: committed + deployed + verified in production~~

**Shipped:** commit `0c209a4` (built on `344fa6a`, an earlier fix that parallelized the wizard's overlay+theme AI calls — see git log), no migration needed, deployed (Version ID `3371975e-b678-4fe1-ba67-9eedf4d8194c`). JW's live guest-passcode dashboard confirmed byte-identical post-deploy (computed CSS vars + page text both match exactly), toggle confirmed present and functional in production.

**Incident during this pass, not part of the diff:** while wrapping up, found all three real production projects (`sarah-tom-wedding`, `coco-calvin-wedding`, `paris-james-wedding`) archived on production D1 with no clear record of how — unrelated to this commit's changes. Flagged to the user; they restored all three via the admin Recycle Bin UI, confirmed back to active.
