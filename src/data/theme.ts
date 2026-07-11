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
