# EventFlow Production — Build Plan

Live at `https://imeevent.pskspace.workers.dev`. Next.js 16 + Cloudflare Workers/D1/R2, Zustand store.
JW's project (`jw-gala-garden-night`, guest passcode `cheewitcheewa`) must stay byte-identical through every phase.

## Foundation build

- [x] Scaffold Next.js app + theme
- [x] Typed data layer
- [x] Module 1: Event Flow timeline
- [x] Module 2: Entertainment Builder
- [x] Module 3: Revenue vs Costing simulator
- [x] Module 4: Present mode + extras
- [x] P&L history comparison + benchmarked simulation
- [x] Tiered-package revenue model + 2026 Costing Deep Dive tab
- [x] Custom acts + decor kind data model, CRUD, live energy calc
- [x] SaaS landing page + passcode gate
- [x] Migrate deploy target to Cloudflare Workers (OpenNext) + D1 schema
- [x] Auth system (admin-invite only) + admin user/project management
- [x] Project passcode for instant guest access
- [x] Act photo overrides: R2 upload, edit/reset any catalogue item
- [x] Shared project state (lineup/program/financials) synced via D1, viewer read-only enforcement
- [x] MiniMax AI integration (text + image gen) wired as Cloudflare secret
- [x] AI presentation slides: generate/edit + PDF export
- [x] Project tasks: checklist + Gantt timeline view
- [x] Timeline presets (5 presets, relative-offset import)
- [x] Project documents: PDF text extraction, R2 upload, AI task suggestions from docs
- [x] Media Library (Phase 1): media_assets table, MediaPicker, beat gallery/key-visual/ref-videos, `/media` tab
- [x] Talent + inline-create (Phase 2): talent table, inline show/decor/talent creation from beat drawer
- [x] AI content-assist (Phase 3): draft-with-AI on beat/item/talent fields, run-of-show AI review
- [x] Static-slide AI generation wired into `/present`
- [x] Event Flow UX: reorder/delete rows, drag-and-drop (dnd-kit), ActCard photo popup
- [x] Media Library extras: link-type assets, AI-assisted media search
- [x] Remove Finale route from nav (kept data file)

## Phase A — Currency + multi-day events

- [x] A1: currency-aware `money()` + `CurrencyCode` registry, wired through revenue/costing/present/Waterfall/LineupPanel/ActLibrary/AI, currency picker
- [x] A2: `Beat.day` field + multi-day rendering/add/move/drag in Event Flow
- [x] Verified: JW figures byte-identical (THB), currency switch works, multi-day project renders correctly

## Phase B — Project templates wizard

- [x] B1: `EventMeta.eventType` + `days` fields
- [x] B2: incentive task preset
- [x] B3: `projectTemplates.ts` registry
- [x] B4: server action for template-based creation
- [x] B5: `NewProjectWizard` client component
- [x] B6: wire wizard into `/projects` page
- [x] B7: verified

## Phase C — AI-assisted project generation

- [x] C1: MiniMax `generateSlideCopy` token budget param
- [x] C2: `aiHints` + AI overlay generation in `projectTemplates.ts`
- [x] C3: `/api/builder/project/generate` route
- [x] C4: server action accepts optional AI overlay
- [x] C5: wizard UI — notes field + Generate/preview/accept flow
- [x] C6: verified

## Phase D — Event-type vocabulary + per-day costing

- [x] D1: genericize Finale slide fallback (JW exempted)
- [x] D2: `Beat.audience`/`attire` fields + Event Flow chips
- [x] D3: per-archetype vocabulary in dashboard/present/costing UI
- [x] D4: `CostLine.day` + per-day spend breakdown in Costing
- [x] D5: verified

## Phase E — JW data isolation fixes

- [x] E1: fix blank-project JW-financials fallback
- [x] E2: gate JW historical comparison to JW only
- [x] E3: stop leaking JW's act catalogue to other projects
- [x] E4: verified

## Phase F — Multi-tenant companies + archive/recycle bin

- [x] F1: migration — `companies`/`company_members` + `projects.company_id`/`archived_at`
- [x] F2: query layer — companies, scoped users/projects, archive/restore
- [x] F3: gate archived projects + company-admin implicit owner in `ProjectLayout`
- [x] F4: wire `company_id` into self-serve wizard project creation
- [x] F5: admin dashboard rework — company sections, recycle bin
- [x] F6: verified

**Shipped:** commit `a3861ec`, migration `0012_companies.sql` applied to production D1, deployed (Version ID `3e91ffe7-1f01-444b-bf83-1a05c94c2c00`). JW's live guest-passcode dashboard confirmed unaffected post-deploy.

## Phase G — Project duplication

- [x] G1: query layer — `duplicateProject()` in `queries.ts` (custom_acts/talent/media/tasks/documents/project_state, talent-id remap in `program`)
- [x] G2: server action — `duplicateProjectAction` (owner or company-admin/super-admin only)
- [x] G3: UI — Duplicate control on `/projects` list
- [x] G4: this file updated
- [x] G5: verify locally (custom acts/talent-id remap/tasks/media/program all confirmed correct on a real duplicate; source project + JW untouched)
- [ ] G6: commit + deploy + verify in production

## Phase H — AI theming

- [ ] Not started

## Phase I — Company Library core (Media + Show & Decor)

- [ ] Not started

## Phase J — Company Library extended (Equipment Rental, Sound & Lighting, Airport Transfers, Tours & Activities)

- [ ] Not started
