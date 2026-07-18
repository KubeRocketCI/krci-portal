import Database from "better-sqlite3";
import type {
  INotificationsStore,
  NotificationEvent,
  NotificationListItem,
} from "@my-project/shared";
import { fromServerRoot } from "@/paths";

const notificationsDbPath = fromServerRoot("db", "notifications.sqlite");

const DEFAULT_LIST_LIMIT = 20;
const DEFAULT_CLEANUP_OLDER_THAN_DAYS = 7;
// No scheduler exists (session cleanup likewise runs only at startup and
// shutdown), so insert() piggybacks a cleanup() at most once per interval.
const CLEANUP_MIN_INTERVAL_MS = 60 * 60 * 1000;

interface DBNotificationRow {
  id: string;
  type: string;
  severity: string;
  title: string;
  body: string;
  namespace: string;
  link: string | null;
  timestamp: string;
  created_at: number;
  read_at: number | null;
}

export class DBNotificationsStore implements INotificationsStore {
  private db: Database.Database;
  private lastCleanupAt = 0;

  // Prepared once — better-sqlite3 recompiles SQL on every prepare() call.
  private insertStmt: Database.Statement;
  private listStmt: Database.Statement;
  private markReadStmt: Database.Statement;
  private markAllReadStmt: Database.Statement;
  private deleteStaleNotificationsStmt: Database.Statement;
  private deleteOrphanReadsStmt: Database.Statement;

  constructor() {
    this.db = new Database(notificationsDbPath);
    this.setupTables();

    this.insertStmt = this.db.prepare(
      `INSERT OR IGNORE INTO notifications (id, type, severity, title, body, namespace, link, timestamp, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    // `? IS NULL OR ...` folds the optional `before` cursor into one statement
    // instead of two near-identical queries that could drift apart.
    this.listStmt = this.db.prepare(
      `SELECT n.*, r.read_at as read_at
       FROM notifications n
       LEFT JOIN notification_reads r ON r.notification_id = n.id AND r.user_sub = ?
       WHERE (? IS NULL OR n.created_at < ?)
       ORDER BY n.created_at DESC
       LIMIT ?`
    );
    this.markReadStmt = this.db.prepare(
      `INSERT INTO notification_reads (user_sub, notification_id, read_at)
       VALUES (?, ?, ?)
       ON CONFLICT(user_sub, notification_id) DO NOTHING`
    );
    this.markAllReadStmt = this.db.prepare(
      `INSERT INTO notification_reads (user_sub, notification_id, read_at)
       SELECT ?, n.id, ?
       FROM notifications n
       WHERE NOT EXISTS (
         SELECT 1 FROM notification_reads r
         WHERE r.user_sub = ? AND r.notification_id = n.id
       )`
    );
    this.deleteStaleNotificationsStmt = this.db.prepare(
      "DELETE FROM notifications WHERE created_at <= ?"
    );
    this.deleteOrphanReadsStmt = this.db.prepare(
      `DELETE FROM notification_reads
       WHERE notification_id NOT IN (SELECT id FROM notifications)`
    );
  }

  private setupTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        namespace TEXT NOT NULL,
        link TEXT,
        timestamp TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

      CREATE TABLE IF NOT EXISTS notification_reads (
        user_sub TEXT NOT NULL,
        notification_id TEXT NOT NULL,
        read_at INTEGER NOT NULL,
        PRIMARY KEY (user_sub, notification_id)
      );
    `);
  }

  /** Idempotent: re-inserting an existing `id` (re-delivered CloudEvent) is a no-op. */
  insert(event: NotificationEvent): void {
    const now = Date.now();
    this.maybeCleanup(now);
    this.insertStmt.run(
      event.id,
      event.type,
      event.severity,
      event.title,
      event.body,
      event.namespace,
      event.link ?? null,
      event.timestamp,
      now
    );
  }

  private maybeCleanup(now: number): void {
    if (now - this.lastCleanupAt < CLEANUP_MIN_INTERVAL_MS) {
      return;
    }
    this.lastCleanupAt = now;
    this.cleanup();
  }

  /** Newest-first, joined with `userSub`'s read-state. `before` paginates by created-at (ms epoch, exclusive). */
  list({
    userSub,
    limit,
    before,
  }: {
    userSub: string;
    limit?: number;
    before?: number;
  }): NotificationListItem[] {
    const rows = this.listStmt.all(
      userSub,
      before ?? null,
      before ?? null,
      limit ?? DEFAULT_LIST_LIMIT
    ) as DBNotificationRow[];

    return rows.map(rowToListItem);
  }

  markRead({ userSub, ids }: { userSub: string; ids: string[] }): void {
    const readAt = Date.now();

    const markMany = this.db.transaction((notificationIds: string[]) => {
      for (const id of notificationIds) {
        this.markReadStmt.run(userSub, id, readAt);
      }
    });

    markMany(ids);
  }

  markAllRead({ userSub }: { userSub: string }): void {
    this.markAllReadStmt.run(userSub, Date.now(), userSub);
  }

  /** Deletes notifications (and their read-state rows) older than `olderThanDays`. */
  cleanup(olderThanDays: number = DEFAULT_CLEANUP_OLDER_THAN_DAYS): void {
    try {
      const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

      const deleteStale = this.db.transaction((cutoffMs: number) => {
        this.deleteStaleNotificationsStmt.run(cutoffMs);
        // markRead accepts arbitrary ids, so orphaned read rows (never-existed
        // or just-deleted notifications) would otherwise accumulate forever.
        this.deleteOrphanReadsStmt.run();
      });

      deleteStale(cutoff);
    } catch (err) {
      console.error("Error cleaning up notifications:", err);
    }
  }
}

function rowToListItem(row: DBNotificationRow): NotificationListItem {
  return {
    id: row.id,
    type: row.type,
    severity: row.severity as NotificationListItem["severity"],
    title: row.title,
    body: row.body,
    namespace: row.namespace,
    link: row.link ?? undefined,
    timestamp: row.timestamp,
    read: row.read_at !== null,
  };
}
