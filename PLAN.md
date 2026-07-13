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

## Phase R — Per-project dashboard re-skin from the AI theme

After shipping Phase H + the theme switcher, the user tried it, generated a
real theme on "Coco & Calvin Wedding," and confirmed for the third time that
what they actually want is the generated palette to change the dashboard's
own colors, not just show as a reference swatch row. Explicitly confirmed
this is a materially bigger, riskier undertaking than anything shipped so
far — the dashboard's core rendering, for every project — before starting.

**The scope turned out smaller than originally estimated.** Phase H's
original framing ("~25+ components hardcode colors, would need a structural
refactor") undersold what the theme-switcher work (Phase T) had already
proven: the dashboard's core palette is 100% CSS-variable driven. That means
no component refactor is needed at all — only (1) a pure function that
derives a full color system from the AI theme's small palette, and (2)
applying it as an inline style at one point (the project layout), which
CSS-variable inheritance then carries to every page and component for free.

- **`src/lib/dashboardTheme.ts` — `deriveDashboardVars()`.** Never trusts the
  AI palette's raw hex values directly for background/text (any of those
  could be too light/dark/saturated to be legible). Instead mirrors the
  built-in dark theme's own structure: one "background hue" (from the
  palette's most-dominant color) carries a lightness ramp for
  bg/bg-soft/panel/panel-2/border/border-soft; an "accent hue" (whichever
  remaining color is most hue-distant from the background) becomes
  gold/gold-bright; the background hue is reused a second time at higher
  saturation/lightness for emerald/emerald-bright (the built-in palette does
  exactly this already); "text hue" comes from the lightest palette color at
  low saturation. Background/text lightness are hard-clamped to known-safe
  ranges — contrast is safe by construction, not by checking-and-adjusting.
  `danger`/`warn` are deliberately never derived (semantic, not brand colors).
  Verified against 4 hand-picked palettes (a real 5-color romantic palette,
  a monochrome-blue edge case, an all-pastel edge case, a warm-red edge
  case) — all produced safe, legible, coherent results.
- **Applied in `src/app/p/[slug]/layout.tsx`**, not per-component: reads
  `project_state.aiTheme` server-side, derives the vars if present, sets
  them as an inline style (plus `data-project-theme=""`) on a real
  `flex flex-col` wrapper div around NavBar+main that explicitly paints
  `background: var(--bg)` itself, mirroring `<body>`'s own layout classes.
  No aiTheme (JW's project, unless she opts in) = no inline style = every
  var falls through to the fixed `:root` defaults, completely unchanged.
  (Originally this wrapper was `display: contents` — invisible to the flex
  layout, CSS vars still cascade through it either way. Changed after local
  verification found it painted no background of its own, so gaps between
  panel sections showed `<body>`'s un-themed color instead of the theme.)
- **Light-mode precedence**: an inline style on a descendant always beats
  whatever it would otherwise inherit, `!important` on an ancestor rule or
  not — inheritance is only a fallback for a property an element doesn't
  declare itself, so `!important` on `[data-theme="light"]` (which only
  targets `<html>`) can never reach through to override the per-project
  theme's own inline redeclaration on the wrapper div. Local verification
  caught this as a real bug (toggling light mode kept showing the custom
  theme). Fixed by targeting the wrapper directly: a new
  `[data-theme="light"] [data-project-theme]` rule in `globals.css`
  re-declares the same 14 vars `!important`, matching the div itself rather
  than just its ancestor. Scope decision unchanged: the per-project re-skin
  applies to the dark/default state only; toggling to light reverts to the
  standard light dashboard palette, not a light-ified version of the custom
  theme.
- **Crash-safety fix from code review**: `state.aiTheme` came back from the
  DB as an unchecked `as EventTheme` cast; a malformed row (e.g. via the
  generic `PUT /api/builder/state` route, which validates only the state
  key, not per-key shape) would throw inside `deriveDashboardVars` and 500
  every route under that project — there's no `error.tsx` boundary to
  contain it. Fixed by routing it through the existing `sanitizeEventTheme`
  validator (already used by both real write paths) before deriving vars;
  confirmed byte-identical output for valid themes, `null`-safe fallback
  for malformed ones.

- [x] ~~R1: `deriveDashboardVars()` — hue/lightness/saturation derivation, hard-clamped contrast~~
- [x] ~~R2: applied in `ProjectLayout` via inline style on the project wrapper div~~
- [x] ~~R3: `data-project-theme` + a descendant-targeted `!important` rule so light mode always wins over a per-project theme~~
- [x] ~~R4: this file updated~~
- [x] ~~R5: verified locally — JW byte-identical, themed project recolors dashboard+flow, light-mode precedence (bug found & fixed), dark-mode restores theme, test data cleaned up~~
- [x] ~~R6: code review (found & fixed the aiTheme crash-safety gap above), commit + deploy + verify in production~~

**Shipped:** commit `0725794`, no migration needed, deployed (Version ID `b6b7bd6d-9587-481e-bded-0f021d308c18`). JW's live guest-passcode dashboard and Event Flow page confirmed byte-identical post-deploy (computed `--bg` matches the fixed default on both `<body>` and the project wrapper div, no console errors); `/projects` account surface unaffected.

## Phase K — Company Library "reverse picker"

Phase I/J's own plan explicitly deferred this: picking a library item from
*inside* the existing Media Library / Show & Decor Builder pages (a second
entry point), rather than only via the standalone `/library` page's own
project-picker-then-copy flow. Scoped to exactly the two pages the original
plan named — media and acts. Vendors stay `/library`-only; there's no
project-scoped "vendor builder" page for a reverse entry point to live in,
and vendor items already flow into Costing as `CostLine`s through the
existing page.

- **No new DB schema, no new copy logic.** Reuses `copyLibraryMediaToProject`/
  `copyLibraryActToProject`/`listLibraryMedia`/`listLibraryActs` from
  `companyLibrary.ts` untouched — this phase is purely a new, correctly-scoped
  access path plus two small UI entry points on top of already-shipped Phase
  I/J primitives.
- **`getProjectLibraryAccess(slug)`** (`src/lib/builder/libraryAccess.ts`) —
  the reverse of `getLibraryAccess()`: resolves the company from the PROJECT
  being viewed (via `getProjectAccess(slug).project.companyId`), not from the
  caller's own primary company. Matters for a company admin or super admin
  working on a project outside their own default company — they now see that
  project's actual library, not their own. Returns `null` (treated as
  unauthorized) for a project with no company assigned.
- **Four new routes** under `/api/builder/library/` (`media`, `media/[id]/copy`,
  `acts`, `acts/[id]/copy`), each a thin wrapper: resolve access, check
  `canWrite` before any copy, call the existing query-layer function.
- **Store**: four new `useDeck` actions (`fetchLibraryMedia`/`copyLibraryMedia`,
  `fetchLibraryActs`/`copyLibraryAct`) mirroring the existing
  `searchMediaAssetsAI`/`addMediaLink`/`addCustomAct` shape — fetch-on-demand
  (not hydrated into long-lived state), copy appends into `mediaAssets`/
  `customActs` in place, same as every existing add-item action.
- **UI**: a "Browse company library" button on the Media Library page (next to
  Add link/Upload) and in `ActLibrary.tsx` (next to + Add new item), each
  opening a portal modal matching the existing `AddLinkModal`/`ItemFormModal`
  chrome, with per-item "Copying…"/"✓ Copied" state.
- **Real bug found by code review, not by local testing**: the two new GET
  (browse) routes checked project membership but not write-role, unlike the
  copy routes. A project's `project_members` includes anonymous
  guest-passcode viewers (a genuine DB-backed row, `role: "viewer"`, per the
  existing guest-access feature) — so a passcode scoped to one client's event
  could browse the whole company's cross-project shared library, including
  content tied to a different client's project. Confirmed live against the
  real dev DB (bug reproduced with the fix reverted, closed with it restored).
  Fixed by adding the same `canWrite` gate the copy routes already had — the
  UI already hid the button for non-writers, so this closes only a
  direct-fetch bypass, with no behavior change for owner/editor users.

- [x] ~~K1: server layer — `getProjectLibraryAccess` + GET/POST routes for media+acts~~
- [x] ~~K2: Media Library UI — browse company library modal~~
- [x] ~~K3: Show & Decor Builder UI — browse company library modal~~
- [x] ~~K4: verified locally (real browse+copy for both media and acts, fresh independent ids confirmed via DB, viewer-role 403 confirmed both UI-hidden and via direct-fetch bypass, test data cleaned up) — code review found & fixed the guest cross-project library-browsing gap above~~

## Phase M — Timeline document + AI upgrades (docx, AI review, per-task docs, preset refine)

Four Timeline/documents enhancements, each built on an existing pattern rather
than a new subsystem. Built and verified locally; **not yet deployed** (no push,
no production D1 migration — that's a separate step when ready).

- **M1 — .docx document support.** `src/lib/docx.ts` mirrors `pdf.ts`'s
  `extractPdfText`: client-side extraction via `mammoth.extractRawText`, since
  MiniMax can't read Word files directly — the browser pulls the text and sends
  that. `DocumentKind` gained `"docx"`; the upload route maps the Office MIME to
  a clean `"docx"` extension (the naïve `type.split("/")[1]` would have produced
  a garbled string); `AddDocumentModal` got a docx branch alongside pdf, and the
  doc chips show a 📃 icon.
- **M2 — AI Timeline review.** A near-exact clone of the run-of-show
  `/api/builder/ai/review` flow, reading the prep-task list instead of the
  program: `/api/builder/ai/timeline-review` route, `reviewTimeline` store
  action, and `TimelineReviewModal` (cloned from `RunOfShowReviewModal`) surfaced
  by an "✨ AI Review" button. `TimelineFinding`/`FindingSeverity` are their own
  types in `tasks.ts` (per-domain self-containment, same as the run-of-show
  side), not shared imports.
- **M3 — per-task document attachment.** Migration `0014_task_documents.sql` — a
  pure many-to-many join (both sides `ON DELETE CASCADE`, gate-tested for cascade
  in both directions against real D1). `listTasks` aggregates attached ids via a
  correlated `GROUP_CONCAT` subquery; `setTaskDocuments` is replace-all
  (delete-then-insert loop, sequential awaits — the project's `MinimalD1Database`
  exposes no `.batch()`). `TaskFormModal` got an "Attached documents" checkbox
  list. **Code review found & fixed** a cross-project/tenant-isolation gap:
  `setTaskDocuments` originally trusted client-supplied ids without scoping — it
  now filters against `project_documents WHERE project_id = ?` and de-dupes
  before insert (a duplicate id would otherwise 500 mid-loop on the PK).
- **M4 — regenerate/refine a preset from a brief.** Migration
  `0015_task_preset_id.sql` adds a nullable `project_tasks.preset_id`, set by
  `createTasksBulk` (optional trailing param, non-breaking for the wizard call
  site) so preset-imported tasks are tagged with their `eventPresets` id. New
  query fns `listImportedPresets` / `listPresetTasks` / `deleteTasksByIds`.
  `/api/builder/ai/refine-preset` proposes a full replacement list from the
  current tasks + a free-text brief (salvage-parse idiom, reused from the
  suggest route); `/api/builder/tasks/refine` commits it by capturing the old
  ids, inserting the new set under the same `preset_id`, THEN deleting the old
  ids — ordered so a mid-insert failure can't wipe the old set (no D1
  transaction available). UI: a gated "✨ Refine a preset" button (hidden until
  a preset is imported) → `RefinePresetModal` (compose → propose) → the existing
  `SuggestionsModal`, generalized with optional copy props, for the accept step.
  Refined tasks carry a due date but no start date (they reuse the
  `SuggestedTask` shape); the Gantt already anchors such tasks on due date.
- **Verification.** All four exercised end-to-end against real local D1 through
  the authenticated dev server (M4's refine hit real MiniMax): import tagged 10
  tasks, refine honored the brief and replaced 10→11 tasks with zero orphans,
  gating shown/hidden correctly, all four coexist on the JW Gala timeline with a
  clean console. `tsc --noEmit` clean. Code review ran inline for M4 (the
  subagent died twice on dropped-connection API errors) — no defects; the M3
  cross-project fix above was the one real finding across the phase. All test
  data cleaned up.

- [x] ~~M1: .docx document support (mammoth extraction, upload/UI/icon)~~
- [x] ~~M2: AI Timeline review (timeline-review route + store + modal + button)~~
- [x] ~~M3: per-task document attachment (0014 migration + join queries + checkbox UI; code review fixed cross-project id gap)~~
- [x] ~~M4: regenerate/refine a preset from a brief (0015 preset_id + refine/apply routes + RefinePresetModal)~~
- [x] ~~M5: verified all four locally end-to-end, inline code review, PLAN.md updated, committed locally (not pushed/deployed)~~

## Phase N — Admin & Library usability

The Company Library forms and the Admin panel were readable only to whoever
built them. This phase makes both usable by a non-technical operator, without
restructuring either data model. Built and verified locally; **not deployed**.

- **N1 — Library form labels.** Every input in the Show & Decor, Vendors, and
  Media add-forms now has a visible label (a module-level `LibField` wrapper —
  module-level, not nested, so inputs don't remount and lose focus). The root
  problem was placeholder-only fields: once a numeric field had a value the
  placeholder vanished, leaving the notorious unlabelled "0 / 10 / 5" boxes,
  which are now clearly **Indicative cost (THB)**, **Stage time (minutes)**,
  and **Energy level (1 = calm, 10 = peak)**. Chip groups got headings
  (Themes / vibe, Where in the show) and the dropdowns clearer option text.
- **N2 — Admin labels + role legend.** An "Admin" heading + one-line purpose,
  a collapsible "What the roles mean" legend explaining Viewer / Editor / Owner
  / Company admin / Super admin / "via passcode" in plain language (the page's
  jargon had no explanation anywhere), a helper line on "Add a user" describing
  the create-login-and-share-password flow, and labels on the previously bare
  assign-member selects ("Give [person] access as [role]").
- **N4 — Confirmation on destructive actions.** Archive, Remove-from-company,
  Remove-from-project, and Delete-account now go through a `ConfirmSubmitButton`
  (a small client component so the admin page stays a server component) that
  shows a contextual `confirm()` naming the exact target before the server
  action fires — previously they were plain one-click submits, with "Remove"
  and "Delete account" sitting inches apart distinguished only by colour.
- **N5 — Passcode copy affordance.** A one-click **Copy** button next to each
  project's guest passcode (shown only when a passcode is set). Deliberately a
  copy button, not masking: a guest passcode is meant to be shared, so hiding it
  would just force a reveal on every use.
- **Verification.** Local, in-browser: library labels render on all three tabs
  (`--text-faint` resolves on the account surface), the role legend expands, the
  confirm gate was proven to block submission when declined (stubbed `confirm()`
  → `formSubmitted: false`, nothing archived), and the copy button renders only
  where a passcode exists. `tsc --noEmit` clean, no console errors. Inline code
  review (no defects — changes are presentational + additive affordances, no
  form/logic paths touched).

- [x] ~~N1: Library form labels — ActForm / VendorForm / MediaTab via `LibField`~~
- [x] ~~N2: Admin labels + collapsible role legend + assign-member labels~~
- [x] ~~N4: confirmation dialogs on Archive / Remove / Delete account~~
- [x] ~~N5: passcode Copy button~~
- [ ] N3: collapsible admin information architecture (company/project cards + switcher) — deferred; the single long scroll still stands, pending a look at the restructure approach
