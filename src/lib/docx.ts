// Client-side .docx text extraction (mirrors pdf.ts's extractPdfText — MiniMax
// can't read Word documents directly, so we pull the text out in the browser
// and send that). Runs in the browser only.

export async function extractDocxText(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}
