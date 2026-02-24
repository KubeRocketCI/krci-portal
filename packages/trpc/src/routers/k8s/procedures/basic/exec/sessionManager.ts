import { PassThrough } from "stream";

// Using any for WebSocket type since it comes from kubernetes client-node
export interface ExecSession {
  sessionId: string;
  namespace: string;
  podName: string;
  container?: string;
  stdinStream: PassThrough;
  stdoutStream: PassThrough;
  stderrStream: PassThrough;
  websocket?: any; // WebSocket from kubernetes client
  cleanup: () => void;
}

class ExecSessionManager {
  private sessions = new Map<string, ExecSession>();

  createSession(sessionId: string, namespace: string, podName: string, container?: string): ExecSession {
    const stdinStream = new PassThrough();
    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();

    const cleanup = () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        try {
          session.websocket?.close();
        } catch {
          // Ignore close errors
        }
        session.stdinStream.destroy();
        session.stdoutStream.destroy();
        session.stderrStream.destroy();
        this.sessions.delete(sessionId);
      }
    };

    const session: ExecSession = {
      sessionId,
      namespace,
      podName,
      container,
      stdinStream,
      stdoutStream,
      stderrStream,
      cleanup,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): ExecSession | undefined {
    return this.sessions.get(sessionId);
  }

  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.cleanup();
    }
  }

  sendToStdin(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    return session.stdinStream.write(data);
  }

  resizeTerminal(sessionId: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session?.websocket) {
      return false;
    }

    try {
      // Send resize message on channel 4
      // Format: { "Width": cols, "Height": rows }
      const resizeMsg = JSON.stringify({ Width: cols, Height: rows });
      const msg = Buffer.concat([Buffer.from([4]), Buffer.from(resizeMsg)]);
      session.websocket.send(msg);
      return true;
    } catch {
      return false;
    }
  }
}

export const execSessionManager = new ExecSessionManager();
