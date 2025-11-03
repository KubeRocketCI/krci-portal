import { vi } from "vitest";
import { DBSessionStore } from "@/clients/db-session-store";
import { CustomSession } from "@my-project/trpc";

export function createMockedDBSessionStore(mockSession: CustomSession) {
  vi.mock("better-sqlite3", () => {
    return {
      default: vi.fn().mockImplementation(() => ({
        prepare: vi.fn(() => ({
          run: vi.fn(),
          get: vi.fn(),
          all: vi.fn(),
        })),
        exec: vi.fn(),
        close: vi.fn(),
      })),
    };
  });

  // Create an in-memory store like your current mock
  const sessionStoreMap = new Map<
    string,
    { expires_at: number; data: string }
  >();

  sessionStoreMap.set("mock-session-id", {
    expires_at: Date.now() + 24 * 60 * 60 * 1000,
    data: JSON.stringify(mockSession),
  });

  // Create a real instance of the DBSessionStore class
  const instance = new DBSessionStore();

  // Override methods with mocked versions
  vi.spyOn(instance, "get").mockImplementation(
    (
      sessionId: string,
      callback: (err: Error | null, result?: CustomSession | null) => void
    ) => {
      const session = sessionStoreMap.get(sessionId);
      if (!session || session.expires_at <= Date.now()) {
        callback(null, null);
        return;
      }
      callback(null, JSON.parse(session.data));
    }
  );

  vi.spyOn(instance, "set").mockImplementation(
    (
      sessionId: string,
      session: CustomSession,
      callback: (err?: Error | null) => void
    ) => {
      const expiresAt = session.cookie.expires
        ? new Date(session.cookie.expires).getTime()
        : Date.now() + 24 * 60 * 60 * 1000;
      sessionStoreMap.set(sessionId, {
        expires_at: expiresAt,
        data: JSON.stringify(session),
      });
      callback(null);
    }
  );

  vi.spyOn(instance, "destroy").mockImplementation(
    (sessionId: string, callback: (err?: Error | null) => void) => {
      sessionStoreMap.delete(sessionId);
      callback(null);
    }
  );

  vi.spyOn(instance, "cleanup").mockImplementation(() => {
    const now = Date.now();
    for (const [sessionId, session] of sessionStoreMap.entries()) {
      if (session.expires_at <= now) {
        sessionStoreMap.delete(sessionId);
      }
    }
  });

  return instance;
}
