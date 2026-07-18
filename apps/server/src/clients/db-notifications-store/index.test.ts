import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NotificationEvent } from "@my-project/shared";
import { DBNotificationsStore } from ".";

// Real better-sqlite3 in-memory: the SQL itself is what's under test, and a
// mocked prepare/run would hide query bugs.
vi.mock("@/paths", () => ({
  fromServerRoot: vi.fn().mockReturnValue(":memory:"),
}));

function buildEvent(
  overrides: Partial<NotificationEvent> = {}
): NotificationEvent {
  return {
    id: "evt-1",
    type: "pipelinerun.failed",
    severity: "error",
    title: "Build pipeline failed",
    body: "PipelineRun review-test-go-app-main-xyz failed in namespace krci",
    namespace: "krci",
    link: "/c/default/pipelineruns/review-test-go-app-main-xyz",
    timestamp: "2026-07-18T10:00:00Z",
    ...overrides,
  };
}

describe("DBNotificationsStore", () => {
  let store: DBNotificationsStore;

  beforeEach(() => {
    store = new DBNotificationsStore();
  });

  describe("insert", () => {
    it("is idempotent for a re-delivered id", () => {
      store.insert(buildEvent());
      store.insert(buildEvent({ title: "A different title on redelivery" }));

      const rows = store.list({ userSub: "user-1" });

      expect(rows).toHaveLength(1);
      expect(rows[0].title).toBe("Build pipeline failed");
    });

    it("stores distinct events separately", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.insert(buildEvent({ id: "evt-2" }));

      const rows = store.list({ userSub: "user-1" });

      expect(rows).toHaveLength(2);
    });
  });

  describe("list", () => {
    it("returns newest-first", () => {
      const nowSpy = vi.spyOn(Date, "now");
      nowSpy.mockReturnValueOnce(1000);
      store.insert(buildEvent({ id: "evt-older" }));
      nowSpy.mockReturnValueOnce(2000);
      store.insert(buildEvent({ id: "evt-newer" }));
      nowSpy.mockRestore();

      const rows = store.list({ userSub: "user-1" });

      expect(rows.map((r) => r.id)).toEqual(["evt-newer", "evt-older"]);
    });

    it("joins the read-state for the requesting user only", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.markRead({ userSub: "user-1", ids: ["evt-1"] });

      const forUser1 = store.list({ userSub: "user-1" });
      const forUser2 = store.list({ userSub: "user-2" });

      expect(forUser1[0].read).toBe(true);
      expect(forUser2[0].read).toBe(false);
    });

    it("respects the limit", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.insert(buildEvent({ id: "evt-2" }));
      store.insert(buildEvent({ id: "evt-3" }));

      const rows = store.list({ userSub: "user-1", limit: 2 });

      expect(rows).toHaveLength(2);
    });

    it("paginates with `before` (exclusive, by created-at)", () => {
      const nowSpy = vi.spyOn(Date, "now");
      nowSpy.mockReturnValue(1000);
      store.insert(buildEvent({ id: "evt-1" }));
      nowSpy.mockReturnValue(2000);
      store.insert(buildEvent({ id: "evt-2" }));
      nowSpy.mockReturnValue(3000);
      store.insert(buildEvent({ id: "evt-3" }));
      nowSpy.mockRestore();

      const rows = store.list({ userSub: "user-1", before: 3000 });

      expect(rows.map((r) => r.id)).toEqual(["evt-2", "evt-1"]);
    });

    it("preserves an unset link as undefined", () => {
      store.insert(buildEvent({ id: "evt-1", link: undefined }));

      const rows = store.list({ userSub: "user-1" });

      expect(rows[0].link).toBeUndefined();
    });
  });

  describe("markRead", () => {
    it("marks only the given ids as read", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.insert(buildEvent({ id: "evt-2" }));

      store.markRead({ userSub: "user-1", ids: ["evt-1"] });

      const rows = store.list({ userSub: "user-1" });
      const byId = Object.fromEntries(rows.map((r) => [r.id, r.read]));

      expect(byId["evt-1"]).toBe(true);
      expect(byId["evt-2"]).toBe(false);
    });

    it("is idempotent when called twice for the same id", () => {
      store.insert(buildEvent({ id: "evt-1" }));

      expect(() => {
        store.markRead({ userSub: "user-1", ids: ["evt-1"] });
        store.markRead({ userSub: "user-1", ids: ["evt-1"] });
      }).not.toThrow();

      expect(store.list({ userSub: "user-1" })[0].read).toBe(true);
    });
  });

  describe("markAllRead", () => {
    it("marks every existing notification as read for the user", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.insert(buildEvent({ id: "evt-2" }));
      store.insert(buildEvent({ id: "evt-3" }));

      store.markAllRead({ userSub: "user-1" });

      const rows = store.list({ userSub: "user-1" });
      expect(rows.every((r) => r.read)).toBe(true);
    });

    it("does not affect another user's read-state", () => {
      store.insert(buildEvent({ id: "evt-1" }));

      store.markAllRead({ userSub: "user-1" });

      expect(store.list({ userSub: "user-2" })[0].read).toBe(false);
    });

    it("does not mark notifications inserted afterward", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.markAllRead({ userSub: "user-1" });
      store.insert(buildEvent({ id: "evt-2" }));

      const rows = store.list({ userSub: "user-1" });
      const byId = Object.fromEntries(rows.map((r) => [r.id, r.read]));

      expect(byId["evt-1"]).toBe(true);
      expect(byId["evt-2"]).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("removes notifications older than the cutoff", () => {
      const nowSpy = vi.spyOn(Date, "now");
      const now = 1_000_000_000_000;
      const eightDaysMs = 8 * 24 * 60 * 60 * 1000;

      nowSpy.mockReturnValue(now - eightDaysMs);
      store.insert(buildEvent({ id: "evt-old" }));

      nowSpy.mockReturnValue(now);
      store.insert(buildEvent({ id: "evt-new" }));

      store.cleanup(7);
      nowSpy.mockRestore();

      const rows = store.list({ userSub: "user-1" });
      expect(rows.map((r) => r.id)).toEqual(["evt-new"]);
    });

    it("purges read-state rows left without a matching notification", () => {
      store.insert(buildEvent({ id: "evt-1" }));
      store.markRead({ userSub: "user-1", ids: ["never-existed"] });

      store.cleanup();

      const orphanCount = (
        store as unknown as { db: import("better-sqlite3").Database }
      ).db
        .prepare(
          "SELECT COUNT(*) as count FROM notification_reads WHERE notification_id = 'never-existed'"
        )
        .get() as { count: number };
      expect(orphanCount.count).toBe(0);
      // The read row for a live notification survives.
      store.markRead({ userSub: "user-1", ids: ["evt-1"] });
      store.cleanup();
      expect(store.list({ userSub: "user-1" })[0].read).toBe(true);
    });

    it("runs opportunistically on insert at most once per interval", () => {
      const nowSpy = vi.spyOn(Date, "now");
      const now = 1_000_000_000_000;
      const eightDaysMs = 8 * 24 * 60 * 60 * 1000;

      nowSpy.mockReturnValue(now - eightDaysMs);
      store.insert(buildEvent({ id: "evt-old" }));

      nowSpy.mockReturnValue(now);
      store.insert(buildEvent({ id: "evt-new" }));
      nowSpy.mockRestore();

      const rows = store.list({ userSub: "user-1" });
      expect(rows.map((r) => r.id)).toEqual(["evt-new"]);
    });

    it("swallows errors instead of throwing", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (store as unknown as { db: { close: () => void } }).db.close();

      expect(() => store.cleanup()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error cleaning up notifications:",
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
