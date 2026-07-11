import "server-only";
import { getDB } from "@/lib/cf";
import {
  LibraryMediaItem,
  LibraryAct,
  LibraryVendorItem,
  NewLibraryVendorInput,
  VendorCategory,
} from "@/data/companyLibrary";
import { MediaAssetKind, MediaAsset } from "@/data/media";
import { NewActInput, Act, Placement, ThemeKey } from "@/data/acts";
import { energyLabelFor, placeholderPhoto } from "@/lib/builder/customActs";
import { getProjectState, setProjectState } from "@/lib/builder/projectState";
import { defaultFinancials, FinancialAssumptions } from "@/data/financials";
import { CostGroupKey } from "@/data/costStructure";

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

interface LibraryMediaRow {
  id: string;
  kind: MediaAssetKind;
  name: string;
  fileKey: string;
  posterKey: string | null;
  linkUrl: string | null;
  mime: string | null;
  createdAt: string;
}

function rowToLibraryMedia(row: LibraryMediaRow): LibraryMediaItem {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    url: row.fileKey ? `/api/builder/photo/${row.fileKey}` : "",
    fileKey: row.fileKey,
    posterUrl: row.posterKey ? `/api/builder/photo/${row.posterKey}` : null,
    linkUrl: row.linkUrl,
    mime: row.mime,
    createdAt: row.createdAt,
  };
}

export async function listLibraryMedia(companyId: string): Promise<LibraryMediaItem[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, kind, name, file_key as fileKey, poster_key as posterKey,
              link_url as linkUrl, mime, created_at as createdAt
       FROM company_library_media WHERE company_id = ? ORDER BY created_at DESC`
    )
    .bind(companyId)
    .all<LibraryMediaRow>();
  return results.map(rowToLibraryMedia);
}

export async function createLibraryMedia(
  companyId: string,
  createdBy: string,
  input: { kind: MediaAssetKind; name: string; fileKey: string; posterKey?: string | null; linkUrl?: string | null; mime?: string | null }
): Promise<LibraryMediaItem> {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO company_library_media (id, company_id, kind, name, file_key, poster_key, link_url, mime, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      companyId,
      input.kind,
      input.name.trim() || "Untitled",
      input.fileKey,
      input.posterKey ?? null,
      input.linkUrl ?? null,
      input.mime ?? null,
      createdBy
    )
    .run();
  return rowToLibraryMedia({
    id,
    kind: input.kind,
    name: input.name.trim() || "Untitled",
    fileKey: input.fileKey,
    posterKey: input.posterKey ?? null,
    linkUrl: input.linkUrl ?? null,
    mime: input.mime ?? null,
    createdAt: new Date().toISOString(),
  });
}

export async function deleteLibraryMedia(companyId: string, id: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM company_library_media WHERE company_id = ? AND id = ?")
    .bind(companyId, id)
    .run();
}

// Copies a library media item into a project's own media library — a fresh
// id (media_assets.id is a bare PK, not project-scoped) but the same
// file_key, since the underlying R2 object is immutable and safely shared.
export async function copyLibraryMediaToProject(
  companyId: string,
  mediaId: string,
  projectId: string,
  createdBy: string
): Promise<MediaAsset> {
  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT id, kind, name, file_key as fileKey, poster_key as posterKey,
              link_url as linkUrl, mime, created_at as createdAt
       FROM company_library_media WHERE company_id = ? AND id = ?`
    )
    .bind(companyId, mediaId)
    .first<LibraryMediaRow>();
  if (!row) throw new Error("Library media item not found.");

  const newAssetId = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO media_assets (id, project_id, kind, name, file_key, poster_key, link_url, mime, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(newAssetId, projectId, row.kind, row.name, row.fileKey, row.posterKey, row.linkUrl, row.mime, createdBy)
    .run();

  return {
    id: newAssetId,
    kind: row.kind,
    name: row.name,
    url: row.fileKey ? `/api/builder/photo/${row.fileKey}` : "",
    fileKey: row.fileKey,
    posterUrl: row.posterKey ? `/api/builder/photo/${row.posterKey}` : null,
    linkUrl: row.linkUrl,
    mime: row.mime,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Show & Decor acts
// ---------------------------------------------------------------------------

interface LibraryActRow {
  id: string;
  kind: "show" | "decor";
  name: string;
  type: string;
  description: string;
  themes: string; // JSON
  requiresDark: number;
  durationMin: number;
  costTHB: number;
  photo: string;
  placement: string | null; // JSON
  energy: number | null;
  energyLabel: string | null;
  createdAt: string;
}

function rowToLibraryAct(row: LibraryActRow): LibraryAct {
  return {
    id: row.id,
    kind: row.kind,
    name: row.name,
    type: row.type,
    description: row.description,
    themes: JSON.parse(row.themes) as ThemeKey[],
    requiresDark: Boolean(row.requiresDark),
    durationMin: row.durationMin,
    costTHB: row.costTHB,
    photo: row.photo,
    placement: row.placement ? (JSON.parse(row.placement) as Placement[]) : undefined,
    energy: row.energy ?? undefined,
    energyLabel: row.energyLabel ?? undefined,
    createdAt: row.createdAt,
  };
}

export async function listLibraryActs(companyId: string): Promise<LibraryAct[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, kind, name, type, description, themes,
              requires_dark as requiresDark, duration_min as durationMin,
              cost_thb as costTHB, photo, placement, energy, energy_label as energyLabel,
              created_at as createdAt
       FROM company_library_acts WHERE company_id = ? ORDER BY created_at ASC`
    )
    .bind(companyId)
    .all<LibraryActRow>();
  return results.map(rowToLibraryAct);
}

function actFields(input: NewActInput) {
  const isShow = input.kind === "show";
  const energy = isShow ? Math.max(1, Math.min(10, input.energy ?? 5)) : null;
  const energyLabel = energy !== null ? energyLabelFor(energy) : null;
  const placement = isShow ? JSON.stringify(input.placement?.length ? input.placement : ["mid"]) : null;
  const photo = input.photo?.trim() || placeholderPhoto();
  const name = input.name.trim() || "Untitled item";
  const type = input.type.trim() || (isShow ? "Custom act" : "Decor / Element");
  const themes = JSON.stringify(input.themes.length ? input.themes : ["interactive"]);
  return { isShow, energy, energyLabel, placement, photo, name, type, themes };
}

export async function createLibraryAct(
  companyId: string,
  createdBy: string,
  input: NewActInput
): Promise<LibraryAct> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const f = actFields(input);

  await db
    .prepare(
      `INSERT INTO company_library_acts
        (id, company_id, kind, name, type, description, themes, requires_dark,
         duration_min, cost_thb, photo, placement, energy, energy_label, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      companyId,
      input.kind,
      f.name,
      f.type,
      input.description.trim(),
      f.themes,
      input.requiresDark ? 1 : 0,
      input.durationMin || 10,
      input.costTHB || 0,
      f.photo,
      f.placement,
      f.energy,
      f.energyLabel,
      createdBy
    )
    .run();

  return {
    id,
    kind: input.kind,
    name: f.name,
    type: f.type,
    description: input.description.trim(),
    themes: JSON.parse(f.themes) as ThemeKey[],
    requiresDark: input.requiresDark,
    durationMin: input.durationMin || 10,
    costTHB: input.costTHB || 0,
    photo: f.photo,
    placement: f.placement ? (JSON.parse(f.placement) as Placement[]) : undefined,
    energy: f.energy ?? undefined,
    energyLabel: f.energyLabel ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

export async function updateLibraryAct(
  companyId: string,
  id: string,
  input: NewActInput
): Promise<void> {
  const db = await getDB();
  const f = actFields(input);
  await db
    .prepare(
      `UPDATE company_library_acts SET
        kind = ?, name = ?, type = ?, description = ?, themes = ?,
        requires_dark = ?, duration_min = ?, cost_thb = ?,
        photo = COALESCE(NULLIF(?, ''), photo),
        placement = ?, energy = ?, energy_label = ?
       WHERE company_id = ? AND id = ?`
    )
    .bind(
      input.kind,
      f.name,
      f.type,
      input.description.trim(),
      f.themes,
      input.requiresDark ? 1 : 0,
      input.durationMin || 10,
      input.costTHB || 0,
      input.photo?.trim() ?? "",
      f.placement,
      f.energy,
      f.energyLabel,
      companyId,
      id
    )
    .run();
}

export async function deleteLibraryAct(companyId: string, id: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM company_library_acts WHERE company_id = ? AND id = ?")
    .bind(companyId, id)
    .run();
}

// Copies a library act into a project's own custom_acts as a fresh (never
// overridden) item — custom_acts' PK is (project_id, id), so a fresh id
// avoids any risk of colliding with an unrelated built-in catalogue id.
export async function copyLibraryActToProject(
  companyId: string,
  actId: string,
  projectId: string,
  createdBy: string
): Promise<Act> {
  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT id, kind, name, type, description, themes,
              requires_dark as requiresDark, duration_min as durationMin,
              cost_thb as costTHB, photo, placement, energy, energy_label as energyLabel,
              created_at as createdAt
       FROM company_library_acts WHERE company_id = ? AND id = ?`
    )
    .bind(companyId, actId)
    .first<LibraryActRow>();
  if (!row) throw new Error("Library act not found.");

  const newActId = `custom-${crypto.randomUUID()}`;
  await db
    .prepare(
      `INSERT INTO custom_acts
        (id, project_id, kind, name, type, description, themes, requires_dark,
         duration_min, cost_thb, photo, placement, energy, energy_label, is_override, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
    )
    .bind(
      newActId,
      projectId,
      row.kind,
      row.name,
      row.type,
      row.description,
      row.themes,
      row.requiresDark,
      row.durationMin,
      row.costTHB,
      row.photo,
      row.placement,
      row.energy,
      row.energyLabel,
      createdBy
    )
    .run();

  return {
    id: newActId,
    name: row.name,
    type: row.type,
    description: row.description,
    kind: row.kind,
    energy: row.energy ?? undefined,
    energyLabel: row.energyLabel ?? undefined,
    placement: row.placement ? (JSON.parse(row.placement) as Placement[]) : undefined,
    themes: JSON.parse(row.themes) as ThemeKey[],
    requiresDark: Boolean(row.requiresDark),
    durationMin: row.durationMin,
    costTHB: row.costTHB,
    photo: row.photo,
    photos: [row.photo],
    custom: true,
    overridden: false,
  };
}

// ---------------------------------------------------------------------------
// Vendor items (Equipment Rental, Sound & Lighting, Airport Transfers, Tours
// & Activities)
// ---------------------------------------------------------------------------

interface LibraryVendorRow {
  id: string;
  category: VendorCategory;
  name: string;
  description: string;
  photo: string | null;
  costTHB: number;
  unit: string;
  vendorContact: string;
  createdAt: string;
}

function rowToLibraryVendor(row: LibraryVendorRow): LibraryVendorItem {
  return { ...row };
}

export async function listLibraryVendors(companyId: string): Promise<LibraryVendorItem[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, category, name, description, photo, cost_thb as costTHB,
              unit, vendor_contact as vendorContact, created_at as createdAt
       FROM company_library_vendors WHERE company_id = ? ORDER BY created_at ASC`
    )
    .bind(companyId)
    .all<LibraryVendorRow>();
  return results.map(rowToLibraryVendor);
}

export async function createLibraryVendor(
  companyId: string,
  createdBy: string,
  input: NewLibraryVendorInput
): Promise<LibraryVendorItem> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const name = input.name.trim() || "Untitled item";
  await db
    .prepare(
      `INSERT INTO company_library_vendors
        (id, company_id, category, name, description, photo, cost_thb, unit, vendor_contact, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      companyId,
      input.category,
      name,
      input.description.trim(),
      input.photo?.trim() || null,
      input.costTHB || 0,
      input.unit.trim(),
      input.vendorContact.trim(),
      createdBy
    )
    .run();
  return {
    id,
    category: input.category,
    name,
    description: input.description.trim(),
    photo: input.photo?.trim() || null,
    costTHB: input.costTHB || 0,
    unit: input.unit.trim(),
    vendorContact: input.vendorContact.trim(),
    createdAt: new Date().toISOString(),
  };
}

export async function updateLibraryVendor(
  companyId: string,
  id: string,
  input: NewLibraryVendorInput
): Promise<void> {
  const db = await getDB();
  await db
    .prepare(
      `UPDATE company_library_vendors SET
        category = ?, name = ?, description = ?,
        photo = COALESCE(NULLIF(?, ''), photo),
        cost_thb = ?, unit = ?, vendor_contact = ?
       WHERE company_id = ? AND id = ?`
    )
    .bind(
      input.category,
      input.name.trim() || "Untitled item",
      input.description.trim(),
      input.photo?.trim() ?? "",
      input.costTHB || 0,
      input.unit.trim(),
      input.vendorContact.trim(),
      companyId,
      id
    )
    .run();
}

export async function deleteLibraryVendor(companyId: string, id: string): Promise<void> {
  const db = await getDB();
  await db
    .prepare("DELETE FROM company_library_vendors WHERE company_id = ? AND id = ?")
    .bind(companyId, id)
    .run();
}

// Fixed, non-configurable mapping from vendor category to the project's
// existing 5 like-for-like cost groups (see costStructure.ts) — both target
// groups already explicitly describe covering exactly these categories, so
// no new cost group is needed.
const VENDOR_CATEGORY_TO_COST_GROUP: Record<VendorCategory, CostGroupKey> = {
  equipment: "production",
  "sound-lighting": "production",
  "airport-transfers": "others",
  "tours-activities": "others",
};

// Copies a library vendor item into a project as a new Costing line — vendor
// items are rentable/bookable line items with a cost, and Costing already
// has exactly this shape, so there's no need for a separate project-level
// vendor table.
export async function copyLibraryVendorToProject(
  companyId: string,
  vendorId: string,
  projectId: string,
  updatedBy: string
): Promise<void> {
  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT id, category, name, description, photo, cost_thb as costTHB,
              unit, vendor_contact as vendorContact, created_at as createdAt
       FROM company_library_vendors WHERE company_id = ? AND id = ?`
    )
    .bind(companyId, vendorId)
    .first<LibraryVendorRow>();
  if (!row) throw new Error("Library vendor item not found.");

  const state = await getProjectState(projectId);
  const financials = (state.financials as FinancialAssumptions | null) ?? defaultFinancials;
  const noteParts = [row.unit, row.vendorContact].filter(Boolean);
  const newLine = {
    id: crypto.randomUUID(),
    group: VENDOR_CATEGORY_TO_COST_GROUP[row.category],
    label: row.name,
    value: row.costTHB,
    note: noteParts.length ? noteParts.join(" · ") : undefined,
  };
  await setProjectState(
    projectId,
    "financials",
    { ...financials, costLines: [...financials.costLines, newLine] },
    updatedBy
  );
}
