// Turn a pasted YouTube/Vimeo URL into an embeddable iframe src. Returns null
// if it doesn't look like a supported video URL.
export function toEmbedUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  try {
    const yt = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
    );
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  } catch {
    return null;
  }
}
