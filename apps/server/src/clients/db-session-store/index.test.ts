import { vi, describe, it, expect, beforeEach, afterEach, Mock } from "vitest";
import Database from "better-sqlite3";
import { DBSessionStore } from ".";
import { CustomSession } from "@my-project/trpc";

// Mock the better-sqlite3 module
vi.mock("better-sqlite3", () => {
  const mockDb = {
    exec: vi.fn(),
    prepare: vi.fn().mockReturnValue({
      run: vi.fn(),
      get: vi.fn(),
    }),
  };
  return { default: vi.fn().mockReturnValue(mockDb) };
});

// Mock the fromServerRoot utility
vi.mock("@/paths", () => ({
  fromServerRoot: vi.fn().mockReturnValue("/mock/path/sessions.sqlite"),
}));

describe("DBSessionStore", () => {
  let store: DBSessionStore;
  let mockDb: ReturnType<typeof Database>;

  beforeEach(() => {
    mockDb = new Database("");
    store = new DBSessionStore();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("should initialize database and setup table", () => {
      expect(Database).toHaveBeenCalledWith("/mock/path/sessions.sqlite");
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE TABLE")
      );
      expect(mockDb.exec).toHaveBeenCalledWith(
        expect.stringContaining("CREATE INDEX")
      );
    });

    it("should call cleanup on initialization", () => {
      const prepareSpy = mockDb.prepare as ReturnType<typeof vi.fn>;
      prepareSpy.mockReturnValueOnce({ run: vi.fn() });
      store = new DBSessionStore();
      expect(mockDb.prepare).toHaveBeenCalledWith(
        "DELETE FROM sessions WHERE expires_at <= ?"
      );
      expect(prepareSpy().run).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe("get", () => {
    it("should return session data for valid session", async () => {
      // Use a string for expires to match JSON-parsed output
      const expiresDate = new Date(Date.now() + 10000);
      const mockSession = {
        user: {
          data: {
            name: "John Doe",
          },
        },
        cookie: {
          expires: expiresDate.toISOString(),
        } as unknown as CustomSession["cookie"], // Changed to string
      };
      const dbSession = {
        id: "session-1",
        expires_at: Date.now() + 10000,
        data: JSON.stringify(mockSession),
      };
      (mockDb.prepare as Mock).mockReturnValueOnce({
        get: vi.fn().mockReturnValue(dbSession),
      });

      await new Promise((resolve) => {
        store.get("session-1", (err, result) => {
          expect(err).toBeNull();
          expect(result).toEqual(mockSession); // Should now pass
          resolve(null);
        });
      });
    });

    it("should return null for expired session", async () => {
      (mockDb.prepare as Mock).mockReturnValueOnce({
        get: vi.fn().mockReturnValue(null),
      });

      await new Promise((resolve) => {
        store.get("session-1", (err, result) => {
          expect(err).toBeNull();
          expect(result).toBeNull();
          resolve(null);
        });
      });
    });

    it("should handle database errors", async () => {
      (mockDb.prepare as Mock).mockReturnValueOnce({
        get: vi.fn().mockImplementation(() => {
          throw new Error("DB error");
        }),
      });

      await new Promise((resolve) => {
        store.get("session-1", (err, result) => {
          expect(err).toBeInstanceOf(Error);
          expect(result).toBeUndefined();
          resolve(null);
        });
      });
    });
  });

  describe("set", () => {
    it("should store session with provided expiry", async () => {
      const mockSession = {
        user: {
          data: {
            name: "John Doe",
          },
        },
        cookie: { expires: new Date(Date.now() + 10000) },
      } as unknown as CustomSession;
      const sessionId = "session-1";

      await new Promise((resolve) => {
        store.set(sessionId, mockSession, (err) => {
          expect(err).toBeNull();
          expect(mockDb.prepare).toHaveBeenCalledWith(
            expect.stringContaining("INSERT INTO sessions")
          );
          expect((mockDb.prepare as Mock)().run).toHaveBeenCalledWith(
            sessionId,
            mockSession.cookie.expires!.getTime(),
            JSON.stringify(mockSession)
          );
          resolve(null);
        });
      });
    });

    it("should use default expiry when none provided", async () => {
      const mockSession = {
        user: {
          data: {
            name: "John Doe",
          },
        },
        cookie: {},
      } as unknown as CustomSession;
      const sessionId = "session-1";

      await new Promise((resolve) => {
        store.set(sessionId, mockSession, (err) => {
          expect(err).toBeNull();
          expect((mockDb.prepare as Mock)().run).toHaveBeenCalledWith(
            sessionId,
            expect.any(Number),
            JSON.stringify(mockSession)
          );
          resolve(null);
        });
      });
    });

    it("should handle database errors", async () => {
      (mockDb.prepare as Mock).mockReturnValueOnce({
        run: vi.fn().mockImplementation(() => {
          throw new Error("DB error");
        }),
      });

      await new Promise((resolve) => {
        store.set("session-1", {} as unknown as CustomSession, (err) => {
          expect(err).toBeInstanceOf(Error);
          resolve(null);
        });
      });
    });
  });

  describe("destroy", () => {
    it("should delete session", async () => {
      await new Promise((resolve) => {
        store.destroy("session-1", (err) => {
          expect(err).toBeNull();
          expect(mockDb.prepare).toHaveBeenCalledWith(
            "DELETE FROM sessions WHERE id = ?"
          );
          expect((mockDb.prepare as Mock)().run).toHaveBeenCalledWith(
            "session-1"
          );
          resolve(null);
        });
      });
    });

    it("should handle database errors", async () => {
      (mockDb.prepare as Mock).mockReturnValueOnce({
        run: vi.fn().mockImplementation(() => {
          throw new Error("DB error");
        }),
      });

      await new Promise((resolve) => {
        store.destroy("session-1", (err) => {
          expect(err).toBeInstanceOf(Error);
          resolve(null);
        });
      });
    });
  });

  describe("cleanup", () => {
    it("should remove expired sessions", () => {
      store.cleanup();
      expect(mockDb.prepare).toHaveBeenCalledWith(
        "DELETE FROM sessions WHERE expires_at <= ?"
      );
      expect((mockDb.prepare as Mock)().run).toHaveBeenCalledWith(
        expect.any(Number)
      );
    });

    it("should handle database errors gracefully", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (mockDb.prepare as Mock).mockReturnValueOnce({
        run: vi.fn().mockImplementation(() => {
          throw new Error("DB error");
        }),
      });

      store.cleanup();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error cleaning up sessions:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
