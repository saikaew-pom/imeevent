import "server-only";
import { cookies } from "next/headers";
import { getDB } from "@/lib/cf";

export const SESSION_COOKIE = "session";
const SESSION_DAYS = 30;

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSession(userId: string): Promise<string> {
  const db = await getDB();
  const id = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await db
    .prepare("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(id, userId, expiresAt)
    .run();

  const store = await cookies();
  store.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  return id;
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    const db = await getDB();
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(token).run();
  }
  store.delete(SESSION_COOKIE);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const db = await getDB();
  const row = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.is_admin as isAdmin
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ? AND s.expires_at > datetime('now')`
    )
    .bind(token)
    .first<{ id: string; email: string; name: string; isAdmin: number }>();

  if (!row) return null;
  return { id: row.id, email: row.email, name: row.name, isAdmin: Boolean(row.isAdmin) };
}
