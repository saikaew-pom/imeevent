const YT_RE = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/;

// Turn a pasted YouTube/Vimeo URL into an embeddable iframe src. Returns null
// if it doesn't look like a supported video URL.
export function toEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const yt = url.match(YT_RE);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  } catch {
    return null;
  }
}

// YouTube publishes a thumbnail at a predictable, unauthenticated URL for any
// video id — usable even when the video itself refuses to embed (a common
// restriction on Shorts). Vimeo has no equivalent without an API call, so
// there's no thumbnail for it here; callers fall back to a generic preview.
export function toVideoThumb(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  const yt = url.match(YT_RE);
  return yt ? `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg` : null;
}
