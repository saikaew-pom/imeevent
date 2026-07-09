import "server-only";
import { getDB } from "@/lib/cf";
import { Act, ItemKind, NewActInput, Placement, ThemeKey } from "@/data/acts";

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
    custom: true,
  };
}

export async function listCustomActs(projectId: string): Promise<Act[]> {
  const db = await getDB();
  const { results } = await db
    .prepare(
      `SELECT id, kind, name, type, description, themes,
              requires_dark as requiresDark, duration_min as durationMin,
              cost_thb as costTHB, photo, placement, energy, energy_label as energyLabel
       FROM custom_acts WHERE project_id = ? ORDER BY created_at ASC`
    )
    .bind(projectId)
    .all<CustomActRow>();
  return results.map(rowToAct);
}

export async function createCustomAct(
  projectId: string,
  createdBy: string,
  input: NewActInput
): Promise<Act> {
  const db = await getDB();
  const id = `custom-${crypto.randomUUID()}`;
  const isShow = input.kind === "show";
  const energy = isShow ? Math.max(1, Math.min(10, input.energy ?? 5)) : null;
  const energyLabel = energy !== null ? energyLabelFor(energy) : null;
  const placement = isShow ? JSON.stringify(input.placement?.length ? input.placement : ["mid"]) : null;
  const photo = input.photo?.trim() || placeholderPhoto();

  await db
    .prepare(
      `INSERT INTO custom_acts
        (id, project_id, kind, name, type, description, themes, requires_dark,
         duration_min, cost_thb, photo, placement, energy, energy_label, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      projectId,
      input.kind,
      input.name.trim() || "Untitled item",
      input.type.trim() || (isShow ? "Custom act" : "Decor / Element"),
      input.description.trim(),
      JSON.stringify(input.themes.length ? input.themes : ["interactive"]),
      input.requiresDark ? 1 : 0,
      input.durationMin || 10,
      input.costTHB || 0,
      photo,
      placement,
      energy,
      energyLabel,
      createdBy
    )
    .run();

  return {
    id,
    name: input.name.trim() || "Untitled item",
    type: input.type.trim() || (isShow ? "Custom act" : "Decor / Element"),
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
    custom: true,
  };
}

export async function updateCustomAct(
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
       WHERE id = ?`
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
      id
    )
    .run();
}

export async function deleteCustomAct(id: string): Promise<void> {
  const db = await getDB();
  await db.prepare("DELETE FROM custom_acts WHERE id = ?").bind(id).run();
}

export async function getCustomActProjectId(id: string): Promise<string | null> {
  const db = await getDB();
  const row = await db
    .prepare("SELECT project_id as projectId FROM custom_acts WHERE id = ?")
    .bind(id)
    .first<{ projectId: string }>();
  return row?.projectId ?? null;
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
