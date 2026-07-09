import "server-only";
import { getDB } from "@/lib/cf";
import { acts as builtInActs, Act, ItemKind, NewActInput, Placement, ThemeKey } from "@/data/acts";

interface CustomActRow {
  id: string;
  kind: ItemKind;
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
  isOverride: number;
}

function rowToAct(row: CustomActRow): Act {
  return {
    id: row.id,
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
    custom: !row.isOverride,
    overridden: Boolean(row.isOverride),
  };
}

export async function listCustomActs(projectId: string): Promise<Act[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, kind, name, type, description, themes,
              requires_dark as requiresDark, duration_min as durationMin,
              cost_thb as costTHB, photo, placement, energy, energy_label as energyLabel,
              is_override as isOverride
       FROM custom_acts WHERE project_id = ? ORDER BY created_at ASC`
    )
    .bind(projectId)
    .all<CustomActRow>();
  return results.map(rowToAct);
}

// Creates a fresh user-added item (baseActId omitted) or an override patch on
// top of a built-in catalogue act (baseActId set to that act's id).
export async function createCustomAct(
  projectId: string,
  createdBy: string,
  input: NewActInput,
  baseActId?: string
): Promise<Act> {
  const db = await getDB();
  const isOverride = Boolean(baseActId && builtInActs.some((a) => a.id === baseActId));
  const id = isOverride ? (baseActId as string) : `custom-${crypto.randomUUID()}`;

  const isShow = input.kind === "show";
  const energy = isShow ? Math.max(1, Math.min(10, input.energy ?? 5)) : null;
  const energyLabel = energy !== null ? energyLabelFor(energy) : null;
  const placement = isShow ? JSON.stringify(input.placement?.length ? input.placement : ["mid"]) : null;
  const photo = input.photo?.trim() || placeholderPhoto();
  const name = input.name.trim() || "Untitled item";
  const type = input.type.trim() || (isShow ? "Custom act" : "Decor / Element");

  await db
    .prepare(
      `INSERT INTO custom_acts
        (id, project_id, kind, name, type, description, themes, requires_dark,
         duration_min, cost_thb, photo, placement, energy, energy_label, is_override, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (project_id, id) DO UPDATE SET
         kind = excluded.kind, name = excluded.name, type = excluded.type,
         description = excluded.description, themes = excluded.themes,
         requires_dark = excluded.requires_dark, duration_min = excluded.duration_min,
         cost_thb = excluded.cost_thb, photo = excluded.photo, placement = excluded.placement,
         energy = excluded.energy, energy_label = excluded.energy_label`
    )
    .bind(
      id,
      projectId,
      input.kind,
      name,
      type,
      input.description.trim(),
      JSON.stringify(input.themes.length ? input.themes : ["interactive"]),
      input.requiresDark ? 1 : 0,
      input.durationMin || 10,
      input.costTHB || 0,
      photo,
      placement,
      energy,
      energyLabel,
      isOverride ? 1 : 0,
      createdBy
    )
    .run();

  return {
    id,
    name,
    type,
    description: input.description.trim(),
    kind: input.kind,
    energy: energy ?? undefined,
    energyLabel: energyLabel ?? undefined,
    placement: placement ? (JSON.parse(placement) as Placement[]) : undefined,
    themes: input.themes.length ? input.themes : ["interactive"],
    requiresDark: input.requiresDark,
    durationMin: input.durationMin || 10,
    costTHB: input.costTHB || 0,
    photo,
    photos: [photo],
    custom: !isOverride,
    overridden: isOverride,
  };
}

export async function updateCustomAct(
  projectId: string,
  id: string,
  input: NewActInput
): Promise<void> {
  const db = await getDB();
  const isShow = input.kind === "show";
  const energy = isShow ? Math.max(1, Math.min(10, input.energy ?? 5)) : null;
  const energyLabel = energy !== null ? energyLabelFor(energy) : null;
  const placement = isShow ? JSON.stringify(input.placement?.length ? input.placement : ["mid"]) : null;

  await db
    .prepare(
      `UPDATE custom_acts SET
        kind = ?, name = ?, type = ?, description = ?, themes = ?,
        requires_dark = ?, duration_min = ?, cost_thb = ?,
        photo = COALESCE(NULLIF(?, ''), photo),
        placement = ?, energy = ?, energy_label = ?
       WHERE project_id = ? AND id = ?`
    )
    .bind(
      input.kind,
      input.name.trim() || "Untitled item",
      input.type.trim() || (isShow ? "Custom act" : "Decor / Element"),
      input.description.trim(),
      JSON.stringify(input.themes.length ? input.themes : ["interactive"]),
      input.requiresDark ? 1 : 0,
      input.durationMin || 10,
      input.costTHB || 0,
      input.photo?.trim() ?? "",
      placement,
      energy,
      energyLabel,
      projectId,
      id
    )
    .run();
}

// Deletes a row — for a fresh custom item this removes it entirely; for an
// override this just reverts the item back to its built-in default (the
// built-in catalogue itself is untouched).
export async function deleteCustomAct(projectId: string, id: string): Promise<void> {
  const db = await getDB();
  await db.prepare("DELETE FROM custom_acts WHERE project_id = ? AND id = ?").bind(projectId, id).run();
}

export async function customActExists(projectId: string, id: string): Promise<boolean> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT 1 as found FROM custom_acts WHERE project_id = ? AND id = ?")
    .bind(projectId, id)
    .first<{ found: number }>();
  return Boolean(row);
}

function energyLabelFor(n: number): string {
  if (n <= 3) return "Low";
  if (n <= 5) return "Medium";
  if (n <= 8) return "High";
  return "Very High";
}

function placeholderPhoto(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#182620"/><text x="50%" y="50%" fill="#5b7268" font-family="sans-serif" font-size="18" text-anchor="middle" dominant-baseline="middle">No photo</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
