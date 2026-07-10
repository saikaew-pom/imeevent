// Talent references (MC, band, performers, vendors) — a reusable builder
// entity distinct from shows/decor. Pure data types (no "server-only"
// imports) so both the client store and server-side query code share them.
export interface Talent {
  id: string;
  name: string;
  role: string;
  description: string;
  photoUrl: string | null; // served via /api/builder/photo/<file_key>
  videoUrl: string | null; // pasted reference video link
  linkUrl: string | null; // external profile/portfolio link
  createdAt: string;
}

export interface NewTalentInput {
  name: string;
  role?: string;
  description?: string;
  photoKey?: string | null; // R2 key from an upload, or null to clear
  videoUrl?: string | null;
  linkUrl?: string | null;
}
