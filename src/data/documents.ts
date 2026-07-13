// Project document library types (contracts, quotes, briefs). Pure data —
// shared by client and server.
export type DocumentKind = "pdf" | "docx" | "image" | "text";

export interface ProjectDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  fileKey: string | null; // R2 key; null for pasted text
  hasText: boolean; // whether text_content is present (not the text itself in lists)
  mime: string | null;
  createdAt: string;
}

export interface NewDocumentInput {
  name: string;
  kind: DocumentKind;
  fileKey?: string | null;
  textContent?: string | null;
  mime?: string | null;
}

// A task the AI proposes from the documents — not yet persisted.
export interface SuggestedTask {
  title: string;
  description: string;
  category: string;
  dueDate: string | null;
}
