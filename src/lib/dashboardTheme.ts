import { EventTheme } from "@/data/theme";

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  const d = max - min;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function circularHueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export interface DashboardVars {
  "--bg": string;
  "--bg-rgb": string;
  "--bg-soft": string;
  "--panel": string;
  "--panel-2": string;
  "--border": string;
  "--border-soft": string;
  "--gold": string;
  "--gold-bright": string;
  "--emerald": string;
  "--emerald-bright": string;
  "--text": string;
  "--text-dim": string;
  "--text-faint": string;
}

// Derives the dashboard's full color system from an AI-generated theme's
// small mood palette (3-6 evocative colors, ordered most-to-least dominant —
// see data/theme.ts). Mirrors the structure of the app's own fixed dark
// palette rather than using the AI's raw hex values directly:
//   - a single "background hue" (from the most-dominant color) carries a
//     lightness ramp (bg -> bg-soft -> panel -> panel-2 -> border-soft ->
//     border), matching how the built-in dark theme is one hue at
//     increasing lightness;
//   - an "accent hue" — whichever remaining palette color is most
//     hue-distant from the background — gets the gold/gold-bright role, so
//     the accent always contrasts visually instead of blending into the bg;
//   - the background hue is reused a second time at higher saturation/
//     lightness for the emerald/emerald-bright role (the built-in palette
//     does exactly this: its "emerald" accent is the same hue family as its
//     background, just far more saturated);
//   - "text hue" comes from the lightest palette color, at low saturation so
//     it still reads as an off-white, just warmed or cooled toward the mood.
// Background/text lightness are hard-clamped to known-safe ranges (not
// merely nudged toward safety) so legibility holds regardless of what the AI
// returned — this never trusts the input palette's own lightness values for
// the roles that most need contrast. danger/warn are deliberately NOT
// derived — they're semantic (error/warning), not brand colors, and
// shouldn't shift with an event's aesthetic.
export function deriveDashboardVars(theme: EventTheme): DashboardVars | null {
  const colors = theme.palette.filter((c) => /^#[0-9a-f]{6}$/i.test(c.hex));
  if (colors.length < 3) return null;

  const hsls = colors.map((c) => hexToHsl(c.hex));
  const bgHue = hsls[0].h;

  let accentHue = hsls[0].h;
  let bestDist = -1;
  for (let i = 1; i < hsls.length; i++) {
    const dist = circularHueDistance(hsls[i].h, bgHue);
    if (dist > bestDist) {
      bestDist = dist;
      accentHue = hsls[i].h;
    }
  }

  let textHue = hsls[0].h;
  let bestL = -1;
  for (const c of hsls) {
    if (c.l > bestL) {
      bestL = c.l;
      textHue = c.h;
    }
  }

  const bg = hslToHex(bgHue, 20, 5);
  const bgRgb = (() => {
    const clean = bg.replace("#", "");
    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);
    return `${r}, ${g}, ${b}`;
  })();

  return {
    "--bg": bg,
    "--bg-rgb": bgRgb,
    "--bg-soft": hslToHex(bgHue, 20, 8),
    "--panel": hslToHex(bgHue, 22, 11),
    "--panel-2": hslToHex(bgHue, 23, 14),
    "--border": hslToHex(bgHue, 18, 22),
    "--border-soft": hslToHex(bgHue, 19, 18),
    "--gold": hslToHex(accentHue, 62, 58),
    "--gold-bright": hslToHex(accentHue, 75, 70),
    "--emerald": hslToHex(bgHue, 60, 38),
    "--emerald-bright": hslToHex(bgHue, 55, 50),
    "--text": hslToHex(textHue, 14, 93),
    "--text-dim": hslToHex(textHue, 11, 66),
    "--text-faint": hslToHex(textHue, 9, 46),
  };
}
