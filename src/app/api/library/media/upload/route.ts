import { NextRequest, NextResponse } from "next/server";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { getPhotosBucket } from "@/lib/cf";
import { createLibraryMedia } from "@/lib/builder/companyLibrary";

// Images only, single-shot — same scope limit as the project-level upload
// route (src/app/api/builder/media/upload/route.ts). Video/audio would need
// the chunked multipart machinery replicated for the library too; not worth
// it until the library actually needs it.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can add to the library." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const name = (form.get("name") as string | null) ?? "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG/PNG/WEBP/GIF images are allowed here." },
      { status: 400 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `File is too large (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB).` },
      { status: 400 }
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "bin";
  const fileKey = `library/${access.companyId}/${crypto.randomUUID()}.${ext}`;
  const bucket = await getPhotosBucket();
  await bucket.put(fileKey, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });

  const item = await createLibraryMedia(access.companyId, access.user.id, {
    kind: "image",
    name: name || file.name.replace(/\.[^.]+$/, ""),
    fileKey,
    mime: file.type,
  });

  return NextResponse.json({ item });
}
