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

// Uploading a large file in one shot means buffering the whole thing in the
// Worker's memory (128MB hard cap per isolate) and staying under Cloudflare's
// ~100MB request body limit — neither survives a 150MB video. R2's native
// multipart API lets the browser upload it in small chunks instead, each one
// well under both limits regardless of the total file size.
export interface R2UploadedPart {
  partNumber: number;
  etag: string;
}

export interface MinimalR2MultipartUpload {
  readonly key: string;
  readonly uploadId: string;
  uploadPart(partNumber: number, value: ArrayBuffer): Promise<R2UploadedPart>;
  complete(uploadedParts: R2UploadedPart[]): Promise<unknown>;
  abort(): Promise<void>;
}

export interface MinimalR2Bucket {
  put(
    key: string,
    value: ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<unknown>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
  createMultipartUpload(
    key: string,
    options?: { httpMetadata?: { contentType?: string } }
  ): Promise<MinimalR2MultipartUpload>;
  // Real R2 binding: synchronous, doesn't validate uploadId until first use.
  resumeMultipartUpload(key: string, uploadId: string): MinimalR2MultipartUpload;
}

export interface Env {
  DB: MinimalD1Database;
  PHOTOS: MinimalR2Bucket;
  MINIMAX_API_KEY: string;
}

export async function getDB(): Promise<MinimalD1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as Env).DB;
}

export async function getPhotosBucket(): Promise<MinimalR2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as unknown as Env).PHOTOS;
}

export async function getMinimaxApiKey(): Promise<string> {
  const { env } = await getCloudflareContext({ async: true });
  const key = (env as unknown as Env).MINIMAX_API_KEY;
  if (!key) throw new Error("MINIMAX_API_KEY is not configured.");
  return key;
}
