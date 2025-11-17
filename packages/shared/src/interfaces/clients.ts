/**
 * Session store interface matching @fastify/session SessionStore contract
 */
export interface ISessionStore {
  get(sessionId: string, callback: (err: Error | null, session: unknown) => void): void;
  set(sessionId: string, session: unknown, callback: (err?: Error | null) => void): void;
  destroy(sessionId: string, callback: (err?: Error | null) => void): void;
  cleanup?(): void;
}
