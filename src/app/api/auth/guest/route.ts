import { NextRequest, NextResponse } from "next/server";
import {
  getProjectBySlug,
  getProjectByPasscode,
  getOrCreateGuestUser,
} from "@/lib/auth/queries";
import { createSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const { slug, passcode } = await req.json();

  if (typeof passcode !== "string" || !passcode.trim()) {
    return NextResponse.json({ error: "Enter a passcode." }, { status: 400 });
  }

  // A passcode alone resolves the project (public entry). If a slug is also
  // given (a specific project's page), it must still match that project.
  const project =
    typeof slug === "string" && slug
      ? await getProjectBySlug(slug)
      : await getProjectByPasscode(passcode);

  if (!project || !project.passcode || passcode.trim() !== project.passcode) {
    return NextResponse.json({ error: "Incorrect passcode." }, { status: 401 });
  }

  const guest = await getOrCreateGuestUser(project);
  await createSession(guest.id);
  return NextResponse.json({ ok: true, slug: project.slug });
}
