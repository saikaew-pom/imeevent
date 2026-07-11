import { NextRequest, NextResponse } from "next/server";
import { getLibraryAccess } from "@/lib/builder/libraryAccess";
import { createLibraryMedia } from "@/lib/builder/companyLibrary";

export async function POST(req: NextRequest) {
  const access = await getLibraryAccess();
  if (!access) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  if (!access.isAdmin) {
    return NextResponse.json({ error: "Only a company admin can add to the library." }, { status: 403 });
  }

  const { url, name } = (await req.json()) as { url: string; name?: string };
  if (!url || !/^https?:\/\//i.test(url.trim())) {
    return NextResponse.json({ error: "That doesn't look like a valid link." }, { status: 400 });
  }

  const trimmedUrl = url.trim();
  const fallbackName = (() => {
    try {
      return new URL(trimmedUrl).hostname.replace(/^www\./, "");
    } catch {
      return "Link";
    }
  })();

  const item = await createLibraryMedia(access.companyId, access.user.id, {
    kind: "link",
    name: (name ?? "").trim() || fallbackName,
    fileKey: "",
    linkUrl: trimmedUrl,
  });

  return NextResponse.json({ item });
}
