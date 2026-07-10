import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";
import { createMediaAsset } from "@/lib/builder/media";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB — kept well under the Worker's
// memory limit since the whole file is buffered in-process before the R2 put.
const MAX_AUDIO_BYTES = 20 * 1024 * 1024; // 20MB — comfortably fits a full song.
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3"]); // audio/mp3 isn't the
// registered MIME type but some browsers/OSes still report it for .mp3 files.

async function putFile(bucket: Awaited<ReturnType<typeof getPhotosBucket>>, projectId: string, file: File): Promise<string> {
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
  const poster = form.get("poster");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const isImage = IMAGE_TYPES.has(file.type);
  const isVideo = VIDEO_TYPES.has(file.type);
  const isAudio = AUDIO_TYPES.has(file.type);
  if (!isImage && !isVideo && !isAudio) {
    return NextResponse.json(
      {
        error:
          "Only JPEG/PNG/WEBP/GIF images, MP4/WEBM/MOV videos, or MP3 audio are allowed.",
      },
      { status: 400 }
    );
  }
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File is too large (max ${Math.round(maxBytes / 1024 / 1024)}MB).` },
      { status: 400 }
    );
  }

  const bucket = await getPhotosBucket();
  const fileKey = await putFile(bucket, access.project.id, file);

  let posterKey: string | null = null;
  if (isVideo && poster instanceof File && IMAGE_TYPES.has(poster.type)) {
    if (poster.size <= MAX_IMAGE_BYTES) {
      posterKey = await putFile(bucket, access.project.id, poster);
    }
  }

  const asset = await createMediaAsset(access.project.id, access.user.id, {
    kind: isVideo ? "video" : isAudio ? "audio" : "image",
    name: name || file.name.replace(/\.[^.]+$/, ""),
    fileKey,
    posterKey,
    mime: file.type,
  });

  return NextResponse.json({ asset });
}
