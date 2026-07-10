// A presentation slide, generated (and then editable) from an Event Flow
// beat. Kept as a plain data type (no "server-only" imports) so both the
// client store and server-side generation code can share it.
export interface Slide {
  id: string; // `beat-${beatId}` when mapped to a program beat, `custom-${uuid}` otherwise
  beatId?: string;
  title: string;
  subtitle: string;
  body: string;
  imageUrl?: string;
  aiGenerated: boolean;
}
