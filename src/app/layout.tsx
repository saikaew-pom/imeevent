import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const display = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EventFlow Production",
  description:
    "The event command deck platform — run of show, entertainment builder, and revenue simulator, built for production teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Applies a stored light/dark preference before first paint, so
            there's no flash of the wrong theme. No stored preference (the
            common case, and always true for a first-ever visit) means this
            is a no-op — every page keeps rendering its own current default
            look untouched. See globals.css's data-theme override blocks and
            ThemeToggle.tsx for the other half of this. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('eventflow-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
