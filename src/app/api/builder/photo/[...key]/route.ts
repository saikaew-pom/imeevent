import { NextRequest, NextResponse } from "next/server";
import { getPhotosBucket } from "@/lib/cf";

// Streams uploaded act photos from R2. Not access-gated by project membership
// (photos are shown on the public/guest-viewable dashboard once linked), but
// the key itself is an unguessable UUID so it isn't discoverable.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key } = await params;
  const bucket = await getPhotosBucket();
  const object = await bucket.get(key.join("/"));
  if (!object) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
