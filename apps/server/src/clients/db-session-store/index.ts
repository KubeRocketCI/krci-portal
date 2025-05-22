import Database from "better-sqlite3";
import { SessionStore } from "@fastify/session";
import { CustomSession } from "../../trpc/context";
import { fromServerRoot } from "@/paths";

const sessionDbPath = fromServerRoot("db", "sessions.sqlite");

interface DBSession {
  id: string;
  expires_at: number;
  data: string;
}

export class DBSessionStore implements SessionStore {
  private db: Database.Database;

  constructor() {
    this.db = new Database(sessionDbPath);
    this.setupTable();
    this.cleanup();
  }

  private setupTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL,
        data TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);
    `);
  }

  /** Get session by ID */
  get(
    sessionId: string,
    callback: (err: Error | null, result?: CustomSession | null) => void
  ): void {
    try {
      const row = this.db
        .prepare("SELECT data FROM sessions WHERE id = ? AND expires_at > ?")
        .get(sessionId, Date.now()) as DBSession;

      if (!row) {
        callback(null, null);
        return;
      }

      const parsedData = JSON.parse(row.data) as CustomSession;

      callback(null, parsedData);
    } catch (err) {
      callback(err as Error);
    }
  }

  /** Set or update session */
  set(
    sessionId: string,
    session: CustomSession,
    callback: (err?: Error | null) => void
  ): void {
    try {
      const expiresAt = session.cookie.expires
        ? session.cookie.expires.getTime()
        : Date.now() + 24 * 60 * 60 * 1000; // Default to 24h if no expiry

      const sessionData = JSON.stringify(session);

      this.db
        .prepare(
          `INSERT INTO sessions (id, expires_at, data) 
           VALUES (?, ?, ?) 
           ON CONFLICT(id) DO UPDATE SET expires_at = excluded.expires_at, data = excluded.data`
        )
        .run(sessionId, expiresAt, sessionData);

      callback(null);
    } catch (err) {
      callback(err as Error);
    }
  }

  /** Destroy session */
  destroy(sessionId: string, callback: (err?: Error | null) => void): void {
    try {
      this.db.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
      callback(null);
    } catch (err) {
      callback(err as Error);
    }
  }

  /** Cleanup expired sessions */
  cleanup(): void {
    try {
      this.db
        .prepare("DELETE FROM sessions WHERE expires_at <= ?")
        .run(Date.now());
    } catch (err) {
      console.error("Error cleaning up sessions:", err);
    }
  }
}
