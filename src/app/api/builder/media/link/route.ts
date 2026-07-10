import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess, canWrite } from "@/lib/builder/access";
import { createMediaAsset } from "@/lib/builder/media";

export async function POST(req: NextRequest) {
  const { slug, url, name } = (await req.json()) as {
    slug: string;
    url: string;
    name?: string;
  };
  if (!slug || !url) {
    return NextResponse.json({ error: "Missing slug or url." }, { status: 400 });
  }
  if (!/^https?:\/\//i.test(url.trim())) {
    return NextResponse.json({ error: "That doesn't look like a valid link." }, { status: 400 });
  }

  const access = await getProjectAccess(slug);
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!canWrite(access.role)) {
    return NextResponse.json({ error: "Viewers can't add links." }, { status: 403 });
  }

  const trimmedUrl = url.trim();
  const fallbackName = (() => {
    try {
      return new URL(trimmedUrl).hostname.replace(/^www\./, "");
    } catch {
      return "Link";
    }
  })();

  const asset = await createMediaAsset(access.project.id, access.user.id, {
    kind: "link",
    name: (name ?? "").trim() || fallbackName,
    fileKey: "",
    linkUrl: trimmedUrl,
  });

  return NextResponse.json({ asset });
}
