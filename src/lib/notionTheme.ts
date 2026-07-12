// Shared palette for the account surfaces (landing, login, projects picker,
// admin, library) — light by default, deliberately distinct from the dark
// emerald/gold theme used inside the gala dashboard itself. Values are CSS
// vars (see globals.css's --acct-* definitions) so these surfaces respond to
// the app-wide light/dark toggle without any consuming component needing to
// change — [data-theme="dark"] overrides them to a dark palette.
export const bg = "var(--acct-bg)";
export const ink = "var(--acct-ink)";
export const sub = "var(--acct-sub)";
export const border = "var(--acct-border)";
export const hoverBg = "var(--acct-hover-bg)";
export const danger = "var(--acct-danger)";
// Solid CTA button fill — intentionally NOT theme-reactive like `ink` above.
// `ink` doubles as body-text color and must flip for dark-mode readability;
// but several buttons use it as a solid background with hardcoded white
// text ("background: ink, color: '#fff'"), which would break (white text on
// a now-light background) if ink flipped. Use accentBg for those instead.
export const accentBg = "var(--acct-accent-bg)";
