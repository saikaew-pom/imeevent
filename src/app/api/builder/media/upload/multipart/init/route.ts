import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { getPhotosBucket } from "@/lib/cf";

const MAX_BYTES = 150 * 1024 * 1024; // 150MB
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);
const AUDIO_TYPES = new Set(["audio/mpeg", "audio/mp3"]);

// Starts a chunked upload for a large (video/audio) file — see part/route.ts
// and complete/route.ts for the rest of the flow, and src/lib/cf.ts for why.
export async function POST(req: NextRequest) {
  const { slug, mime, fileName, size } = (await req.json()) as {
    slug: string;
    mime: string;
    fileName: string;
    size: number;
  };
  if (!slug || !mime || !fileName || typeof size !== "number") {
    return NextResponse.json(
      { error: "Missing slug, mime, fileName, or size." },
      { status: 400 }
    );
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't upload media." }, { status: 403 });
  }

  const isVideo = VIDEO_TYPES.has(mime);
  const isAudio = AUDIO_TYPES.has(mime);
  if (!isVideo && !isAudio) {
    return NextResponse.json(
      { error: "Only MP4/WEBM/MOV videos or MP3 audio use large uploads." },
      { status: 400 }
    );
  }
  if (size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File is too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB).` },
      { status: 400 }
    );
  }

  const ext = fileName.split(".").pop()?.toLowerCase() || mime.split("/")[1] || "bin";
  const key = `media/${access.project.id}/${crypto.randomUUID()}.${ext}`;

  const bucket = await getPhotosBucket();
  const upload = await bucket.createMultipartUpload(key, {
    httpMetadata: { contentType: mime },
  });

  return NextResponse.json({
    uploadId: upload.uploadId,
    key,
    kind: isVideo ? "video" : "audio",
  });
}
