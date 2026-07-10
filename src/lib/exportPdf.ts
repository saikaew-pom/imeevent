// Renders a DOM element to a multi-page A4 PDF (client-side). Elements marked
// with data-export-hide (e.g. the toolbar itself) are skipped in the capture.

export async function exportElementToPdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);

  const bg = getComputedStyle(document.body).backgroundColor || "#0a0f0d";
  const dataUrl = await toPng(el, {
    pixelRatio: 2,
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
  pdf.addImage(dataUrl, "PNG", 0, position, imgW, imgH);
  heightLeft -= pageH;
  while (heightLeft > 0) {
    position -= pageH;
    pdf.addPage();
    pdf.addImage(dataUrl, "PNG", 0, position, imgW, imgH);
    heightLeft -= pageH;
  }
  pdf.save(filename);
}
