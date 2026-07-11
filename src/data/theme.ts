// An AI-generated visual theme concept for an event — a name, a short mood
// description, and a suggested color palette. Purely informational content
// shown in Event Settings and the dashboard hero; it never recolors the
// app's own UI chrome (that stays the fixed emerald/gold look everywhere).
export interface ThemeColor {
  label: string; // e.g. "Blush Pink"
  hex: string; // e.g. "#F4C2C2"
}

export interface EventTheme {
  name: string; // e.g. "Blush Garden Romance"
  description: string; // one-paragraph mood/style description
  palette: ThemeColor[]; // 4-6 colors
  generatedAt: string; // ISO timestamp
}

const HEX_RE = /^#[0-9a-f]{6}$/i;

// Validates and normalizes an arbitrary candidate into an EventTheme, or
// returns null if it's missing required fields or has no valid colors.
// Shared by the server-side AI-response parser (lib/builder/theme.ts) and
// the New Project wizard's server action, which re-validates a theme the
// client echoes back from its own preview call rather than trusting it as-is.
export function sanitizeEventTheme(candidate: unknown): EventTheme | null {
  if (!candidate || typeof candidate !== "object") return null;
  const obj = candidate as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim().slice(0, 80) : "";
  const description =
    typeof obj.description === "string" ? obj.description.trim().slice(0, 400) : "";
  const rawPalette = Array.isArray(obj.palette) ? obj.palette : [];
  const palette: ThemeColor[] = rawPalette
    .filter((c): c is Record<string, unknown> => Boolean(c) && typeof c === "object")
    .map((c) => ({
      label: typeof c.label === "string" ? c.label.trim().slice(0, 40) : "",
      hex: typeof c.hex === "string" ? c.hex.trim() : "",
    }))
    .filter((c) => HEX_RE.test(c.hex))
    .map((c) => ({ label: c.label || c.hex.toUpperCase(), hex: c.hex.toUpperCase() }))
    .slice(0, 6);

  if (!name || !description || palette.length < 3) return null;
  return { name, description, palette, generatedAt: new Date().toISOString() };
}
