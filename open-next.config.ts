import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// No incremental cache override needed yet — the app is fully client-rendered
// (Zustand + localStorage), so there's no ISR/data cache to back with R2.
export default defineCloudflareConfig({});
