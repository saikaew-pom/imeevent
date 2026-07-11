import { NextRequest, NextResponse } from "next/server";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { getPhotosBucket } from "@/lib/cf";

// Generic raw-photo upload for library acts/vendors (returns a URL to store
// directly in their `photo` field) — same shape as the project-level
// src/app/api/builder/upload/route.ts, scoped to the company instead.
const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can add to the library." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WEBP, or GIF images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `library/${access.companyId}/${crypto.randomUUID()}.${ext}`;

  const bucket = await getPhotosBucket();
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  return NextResponse.json({ url: `/api/builder/photo/${key}` });
}
