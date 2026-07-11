// Company Library — a company-scoped catalogue of reusable content (media,
// show/decor acts, and bookable vendor items) that any project under that
// company can copy an item from. Pure data types, shared by client and
// server code, mirroring the shape of the equivalent project-scoped types
// (MediaAsset, Act) so a "copy to project" is a straight field-for-field
// insert.
import { MediaAssetKind } from "./media";
import { ItemKind, Placement, ThemeKey } from "./acts";

export interface LibraryMediaItem {
  id: string;
  kind: MediaAssetKind;
  name: string;
  url: string; // served via /api/builder/photo/<file_key> — empty for kind "link"
  fileKey: string;
  posterUrl: string | null;
  linkUrl: string | null;
  mime: string | null;
  createdAt: string;
}

export interface LibraryAct {
  id: string;
  kind: ItemKind;
  name: string;
  type: string;
  description: string;
  themes: ThemeKey[];
  requiresDark: boolean;
  durationMin: number;
  costTHB: number;
  photo: string;
  placement?: Placement[]; // shows only
  energy?: number; // shows only
  energyLabel?: string; // shows only
  createdAt: string;
}

export type VendorCategory =
  | "equipment"
  | "sound-lighting"
  | "airport-transfers"
  | "tours-activities";

export const VENDOR_CATEGORIES: { key: VendorCategory; label: string }[] = [
  { key: "equipment", label: "Equipment Rental" },
  { key: "sound-lighting", label: "Sound & Lighting" },
  { key: "airport-transfers", label: "Airport Transfers" },
  { key: "tours-activities", label: "Tours & Activities" },
];

export interface LibraryVendorItem {
  id: string;
  category: VendorCategory;
  name: string;
  description: string;
  photo: string | null;
  costTHB: number;
  unit: string; // e.g. "per day", "per trip", "per person"
  vendorContact: string;
  createdAt: string;
}

export interface NewLibraryVendorInput {
  category: VendorCategory;
  name: string;
  description: string;
  photo?: string;
  costTHB: number;
  unit: string;
  vendorContact: string;
}
