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

// Minimal R2 surface we actually use, same rationale as MinimalD1Database above.
export interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}

export interface MinimalR2Bucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

export interface Env {
  DB: MinimalD1Database;
  PHOTOS: MinimalR2Bucket;
}

export async function getDB(): Promise<MinimalD1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as Env).DB;
}

export async function getPhotosBucket(): Promise<MinimalR2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as Env).PHOTOS;
}
