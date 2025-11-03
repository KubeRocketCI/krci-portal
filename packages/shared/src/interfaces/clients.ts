/**
 * Session store interface matching @fastify/session SessionStore contract
 */
export interface ISessionStore {
  get(sessionId: string, callback: (err: Error | null, session: unknown) => void): void;
  set(sessionId: string, session: unknown, callback: (err?: Error | null) => void): void;
  destroy(sessionId: string, callback: (err?: Error | null) => void): void;
  cleanup?(): void;
}

/**
 * Kubernetes client interface
 * Minimal interface based on K8sClient usage in trpc
 */
export interface IK8sClient {
  // This is a minimal interface - actual implementation may have more methods
  // Add specific methods here as needed based on actual usage
}

/**
 * OIDC client interface
 * Minimal interface based on OIDCClient usage in trpc
 */
export interface IOIDCClient {
  // This is a minimal interface - actual implementation may have more methods
  // Add specific methods here as needed based on actual usage
}

