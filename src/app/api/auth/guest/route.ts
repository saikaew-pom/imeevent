import { NextRequest, NextResponse } from "next/server";
import { getProjectBySlug, getOrCreateGuestUser } from "@/lib/auth/queries";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { slug, passcode } = await req.json();

  if (typeof slug !== "string" || typeof passcode !== "string") {
    return NextResponse.json({ error: "Missing project or passcode." }, { status: 400 });
  }

  const project = await getProjectBySlug(slug);
  if (!project || !project.passcode) {
    return NextResponse.json({ error: "This project has no passcode access." }, { status: 404 });
  }

  if (passcode.trim() !== project.passcode) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const guest = await getOrCreateGuestUser(project);
  await createSession(guest.id);
  return NextResponse.json({ ok: true });
}
