// Project media library — uploaded photos/clips reusable across beats,
// talent, and shows. Pure data types (no "server-only" imports) so both the
// client store and server-side query code can share them.
export type MediaAssetKind = "image" | "video";

export interface MediaAsset {
  id: string;
  kind: MediaAssetKind;
  name: string;
  url: string; // served via /api/builder/photo/<file_key>
  fileKey: string; // raw R2 key — same value embedded in `url`, exposed so
  // callers (e.g. attaching this asset's photo to a talent record) can
  // reference the file directly without string-parsing the URL.
  posterUrl: string | null; // for video, if a poster was supplied
  mime: string | null;
  createdAt: string;
}

// Self-contained placeholder poster for videos with no real thumbnail
// (we don't do server-side thumbnail extraction in the Workers runtime).
const posterSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225"><rect width="100%" height="100%" fill="#182620"/><text x="50%" y="50%" fill="#5b7268" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">▶ video</text></svg>`;
export const VIDEO_PLACEHOLDER_POSTER = `data:image/svg+xml;utf8,${encodeURIComponent(posterSvg)}`;
