// Renders a DOM element to a multi-page A4 PDF (client-side). Elements marked
// with data-export-hide (e.g. the toolbar itself) are skipped in the capture.

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
  const bg = getComputedStyle(document.body).backgroundColor || "#0a0f0d";
  const dataUrl = await toJpeg(el, {
    pixelRatio: 1.5,
    quality: 0.92,
    backgroundColor: bg,
    cacheBust: true,
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

  let heightLeft = imgH;
  let position = 0;
  pdf.addImage(dataUrl, "JPEG", 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(dataUrl, "JPEG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(filename);
}
