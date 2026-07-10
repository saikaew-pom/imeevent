import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/builder/access";
import { listMediaAssets } from "@/lib/builder/media";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const assets = await listMediaAssets(access.project.id);
  return NextResponse.json({ role: access.role, assets });
}
