import { getCloudflareContext } from "@opennextjs/cloudflare";

// Minimal D1 surface we actually use — avoids pulling the full
// @cloudflare/workers-types ambient globals into the whole program before
// `wrangler types` has generated a real cloudflare-env.d.ts.
export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<D1Result>;
  all<T = unknown>(): Promise<D1Result<T>>;
  first<T = unknown>(): Promise<T | null>;
}

export interface MinimalD1Database {
  prepare(query: string): D1PreparedStatement;
}

export interface Env {
  DB: MinimalD1Database;
}

export async function getDB(): Promise<MinimalD1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as Env).DB;
}
