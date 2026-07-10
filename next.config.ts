import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve the JW Gala project's original flat URLs (from before the
  // multi-project /p/[slug] restructure) so existing bookmarks/shared links
  // keep working. New projects only ever use /p/[slug] paths.
  async redirects() {
    const legacy = [
      "dashboard",
      "flow",
      "builder",
      "revenue",
      "costing",
      "timeline",
      "media",
      "present",
    ];
    return legacy.map((seg) => ({
      source: `/${seg}`,
      destination: `/p/jw-gala-garden-night/${seg}`,
      permanent: false,
    }));
  },
};

export default nextConfig;

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
