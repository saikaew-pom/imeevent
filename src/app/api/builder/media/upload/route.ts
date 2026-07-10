import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";
import { createMediaAsset } from "@/lib/builder/media";

// Images only — small enough to upload in one shot. Video/audio go through
// the chunked multipart/* routes instead (see src/lib/cf.ts for why).
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function putFile(
  bucket: Awaited<ReturnType<typeof getPhotosBucket>>,
  projectId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || file.type.split("/")[1] || "bin";
  const key = `media/${projectId}/${crypto.randomUUID()}.${ext}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return key;
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug." }, { status: 400 });

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't upload media." }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const name = (form.get("name") as string | null) ?? "";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (!IMAGE_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG/PNG/WEBP/GIF images are allowed here — videos and MP3s use large uploads." },
      { status: 400 }
    );
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: `File is too large (max ${Math.round(MAX_IMAGE_BYTES / 1024 / 1024)}MB).` },
      { status: 400 }
    );
  }

  const bucket = await getPhotosBucket();
  const fileKey = await putFile(bucket, access.project.id, file);

  const asset = await createMediaAsset(access.project.id, access.user.id, {
    kind: "image",
    name: name || file.name.replace(/\.[^.]+$/, ""),
    fileKey,
    posterKey: null,
    mime: file.type,
  });

  return NextResponse.json({ asset });
}
