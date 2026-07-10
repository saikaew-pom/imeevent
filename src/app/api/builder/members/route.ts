import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/builder/access";
import { listProjectMembers } from "@/lib/auth/queries";

function isGuestEmail(email: string): boolean {
  return email.startsWith("guest+");
}

// Read-only, available to any project member (including viewers) — needed
// so the timeline's assignee picker shows real people to pick from.
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const members = (await listProjectMembers(access.project.id))
    .filter((m) => !isGuestEmail(m.email))
    .map((m) => ({ id: m.userId, name: m.name, email: m.email }));

  return NextResponse.json({ members });
}
