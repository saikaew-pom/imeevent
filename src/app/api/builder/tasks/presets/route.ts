import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/builder/access";
import { listImportedPresets } from "@/lib/builder/tasks";
import { getEventPreset } from "@/data/eventPresets";

// Lists the event presets currently imported into a project, enriched with
// each preset's display name/icon. The Timeline's "Refine a preset" control
// hides itself when this returns an empty list.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const rows = await listImportedPresets(access.project.id);
  const presets = rows.map((r) => {
    const meta = getEventPreset(r.presetId);
    return {
      id: r.presetId,
      name: meta?.name ?? r.presetId,
      icon: meta?.icon ?? "📋",
      count: r.count,
    };
  });
  return NextResponse.json({ presets });
}
