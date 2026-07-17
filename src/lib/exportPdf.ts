// Renders a DOM element to a multi-page A4 PDF (client-side). Elements marked
// with data-export-hide (e.g. the toolbar itself) are skipped in the capture.
// Elements marked with data-export-block are kept whole: a page break will
// never land inside one (see pageStarts).

// Stand-in for an image that won't load, as an opaque 1x1 in the sheet's own
// background colour.
//
// Why this exists: html-to-image's embedImageNode wires the cloned <img>'s
// onerror straight to reject(), and a resource it fails to fetch comes back as
// an empty string — so a single dead image URL rejects the WHOLE capture and
// the export dies. Deleting a media asset doesn't scrub beat.media.photo
// references to it, so dead URLs are a normal state, not an edge case: a beat
// that lost its photo must degrade to a gap in that one card, never to a
// failed export of the entire run of show.
//
// Why opaque, and why not the usual transparent-PNG one-liner: that one-liner
// is not actually transparent. The widely copy-pasted 1x1 "transparent" PNG
// (iVBORw0KGgo...RK5CYII=) decodes to rgba(0,0,255,127) — blue at HALF alpha.
// Composited over this sheet's rgb(10,15,13) that is 0.5*255 + 0.5*13 = 134 of
// blue, i.e. the solid navy block measured on a dead thumb: rgb(4,8,134).
// Nothing exotic is going on — a half-opaque blue pixel is navy at any size, so
// neither scaling nor JPEG's lack of an alpha channel is implicated. (A truly
// alpha-0 pixel would have been fine: html-to-image composites onto a canvas
// pre-filled with backgroundColor, and source-over at alpha 0 contributes
// nothing.) Painting the sheet's own colour at full opacity keeps the result
// independent of any of that, and reads as a real gap.
//
// Caveat: html-to-image caches this per image URL in a module-level map keyed
// before cacheBust is applied, so the FIRST failing export in a page session
// pins the placeholder colour. Toggling the theme and re-exporting without a
// reload reuses the old colour. Cosmetic, and only on already-dead images.
const missingImagePlaceholder = (bg: string) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">` +
      `<rect width="1" height="1" fill="${bg}"/></svg>`
  );

type Block = { top: number; bottom: number };

// Where each page starts, in PDF points down the rasterized image.
//
// The naive version walks in fixed pageH steps, which guillotines whatever
// happens to sit on the boundary — a run-of-show card losing its last two
// lines to the page edge. Instead, when a block would straddle the break we
// end the page at that block's top and let it start the next page whole.
//
// Callers that mark no blocks (the P&L and Revenue exports) get plain fixed
// steps, i.e. exactly the old behaviour.
//
// Tolerance is 0.5pt (~0.007in, invisible): it absorbs float drift so a page
// whose content ends a hair's breadth past the boundary doesn't emit a blank
// trailing page.
export function pageStarts(totalH: number, pageH: number, blocks: Block[]): number[] {
  const EPS = 0.5;
  if (!(totalH > 0) || !(pageH > 0)) return [0];

  const sorted = [...blocks].sort((a, b) => a.top - b.top);
  const starts: number[] = [];
  let start = 0;

  // Bounded: each iteration either advances by pageH or to a block top strictly
  // greater than `start`, so it always moves forward. The cap is a backstop.
  for (let i = 0; i < 1000; i++) {
    starts.push(start);
    const hardEnd = start + pageH;
    if (hardEnd >= totalH - EPS) break;

    // A block taller than a page can't be saved by any break — cut it at the
    // page edge rather than loop forever trying to fit it.
    const straddler = sorted.find(
      (b) =>
        b.top > start + EPS &&
        b.top < hardEnd - EPS &&
        b.bottom > hardEnd + EPS &&
        b.bottom - b.top <= pageH
    );
    start = straddler ? straddler.top : hardEnd;
  }
  return starts;
}

export async function exportElementToPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ toJpeg }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);

  // JPEG, not PNG: a screenshot of a text/table-heavy page compresses far
  // better as JPEG (lossy) than PNG (lossless) — this is what was producing
  // multi-tens-of-MB PDFs for long pages like the P&L. Quality 0.92 is
  // visually indistinguishable at print size while cutting file size by
  // roughly 5-10x. pixelRatio trimmed from 2 to 1.5 for the same reason —
  // still crisp on a retina screen/print, but a smaller source raster.
  // Measure while the live element is still laid out, in CSS px relative to
  // the element's own top. Scaled to points once the raster's dimensions are
  // known, below.
  const elRect = el.getBoundingClientRect();
  const blocksPx: Block[] = Array.from(
    el.querySelectorAll<HTMLElement>("[data-export-block]")
  ).map((b) => {
    const r = b.getBoundingClientRect();
    return { top: r.top - elRect.top, bottom: r.bottom - elRect.top };
  });

  const bg = getComputedStyle(document.body).backgroundColor || "#0a0f0d";
  const dataUrl = await toJpeg(el, {
    pixelRatio: 1.5,
    quality: 0.92,
    backgroundColor: bg,
    cacheBust: true,
    // Both are needed: imagePlaceholder covers a resource that fails to fetch
    // (404/network), onImageErrorHandler covers one that fetches but still
    // won't decode (e.g. a 403 body wrapped as image/jpeg). Either way the
    // capture keeps going. See missingImagePlaceholder.
    imagePlaceholder: missingImagePlaceholder(bg),
    onImageErrorHandler: () => {},
    filter: (node) =>
      !(node instanceof HTMLElement && node.dataset?.exportHide !== undefined),
  });

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to rasterize page."));
    img.src = dataUrl;
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const imgW = pageW;
  const imgH = (img.height / img.width) * imgW;

  // px -> pt. The raster is the element scaled to the page width, so the same
  // ratio maps the measured block offsets onto the image.
  const scale = elRect.width > 0 ? imgW / elRect.width : 1;
  const blocks = blocksPx.map((b) => ({ top: b.top * scale, bottom: b.bottom * scale }));

  // The paper jsPDF gives us is white; the sheet is (usually) dark. Any region
  // the raster doesn't cover shows through as a white band, so every page is
  // painted in the sheet's own colour before the image goes down. Two regions
  // need it — the strip an early break opens up, and the tail of the last page
  // below where the content ends — but it's painted unconditionally rather
  // than only on those pages: a full-page rect under a fully-covering raster
  // is invisible, and ~90 bytes/page is not worth branching over.
  //
  // Only rgb()/rgba() serializations are understood. That covers every theme
  // here (--bg is a hex in both light and dark, and hex serializes to rgb()),
  // but note the fallback is dark: a body background authored in a syntax that
  // serializes as-is, e.g. color(display-p3 ...) or oklch(), would silently
  // paint dark green under a light sheet.
  const m = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(bg);
  const bgRgb: [number, number, number] = m
    ? [Number(m[1]), Number(m[2]), Number(m[3])]
    : [10, 15, 13];

  // Each page draws the whole image, offset so `start` sits at the page top.
  //
  // Choosing a break and enforcing it are two different jobs — pageStarts only
  // does the first. A page's own edge clips at start + pageH, so a page whose
  // break was pulled up still paints down to that hard edge on its own: the
  // straddling card renders cut here AND whole again atop the next page. Only
  // pages with a pulled-up break need the clip; the rest — including every page
  // of a no-block export like P&L/Revenue — take the plain path, which places
  // the raster exactly where the old fixed-step loop did. The one difference
  // from that loop is the fill above, so a no-block export's last page now
  // bottoms out in the sheet colour instead of bare white paper.
  const starts = pageStarts(imgH, pageH, blocks);
  starts.forEach((start, i) => {
    if (i > 0) pdf.addPage();

    pdf.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
    pdf.rect(0, 0, pageW, pageH, "F");

    const isLast = i + 1 >= starts.length;
    const drawH = isLast ? pageH : Math.min(pageH, starts[i + 1] - start);

    if (drawH >= pageH) {
      pdf.addImage(dataUrl, "JPEG", 0, -start, imgW, imgH);
      return;
    }

    pdf.saveGraphicsState();
    // Two subtleties. The null style is load-bearing: rect() defaults to
    // stroking, which paints a border AND consumes the path, leaving clip()
    // nothing to clip to — this emits the bare `re`, giving `re W n`. And the
    // rect overhangs left/right so only its horizontal edge ever bites; flush
    // against the page width the edge lands mid-pixel and the rasterizer
    // antialiases the last column against the paper.
    pdf.rect(-1, 0, imgW + 2, drawH, null);
    pdf.clip();
    pdf.discardPath();
    pdf.addImage(dataUrl, "JPEG", 0, -start, imgW, imgH);
    pdf.restoreGraphicsState();
  });
  pdf.save(filename);
}
