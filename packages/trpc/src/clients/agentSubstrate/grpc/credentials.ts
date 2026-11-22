import { readFile, stat } from "node:fs/promises";

const TOKEN_CACHE_TTL_MS = 60_000;

/** Projected ServiceAccount token. The kubelet rewrites the file in place; it is read again after TOKEN_CACHE_TTL_MS. */
export class TokenFile {
  private cache: { token: string; readAt: number } | null = null;

  constructor(
    private readonly path: string,
    private readonly now: () => number
  ) {}

  /** Rejects when the file is missing, unreadable or empty. */
  async read(): Promise<string> {
    const now = this.now();
    if (this.cache && now - this.cache.readAt < TOKEN_CACHE_TTL_MS) {
      return this.cache.token;
    }
    this.cache = null;

    const token = (await readFile(this.path, "utf8")).trim();
    if (!token) {
      throw new Error(`token file ${this.path} is empty`);
    }
    this.cache = { token, readAt: now };
    return token;
  }
}

/** Projected CA bundle (PEM). `changed` reports a new content after the file is replaced. */
export class CaFile {
  private fingerprint: string | null = null;
  private pem: string | null = null;

  constructor(private readonly path: string) {}

  /** The current PEM and whether it differs from the last read. Rejects when the file is missing or holds no certificate. */
  async read(): Promise<{ pem: string; changed: boolean }> {
    const info = await stat(this.path);
    const fingerprint = `${info.ino}:${info.size}:${info.mtimeMs}`;
    if (this.pem !== null && fingerprint === this.fingerprint) {
      return { pem: this.pem, changed: false };
    }

    const pem = await readFile(this.path, "utf8");
    if (!pem.includes("-----BEGIN CERTIFICATE-----")) {
      throw new Error(`CA file ${this.path} holds no PEM certificate`);
    }
    const changed = pem !== this.pem;
    this.fingerprint = fingerprint;
    this.pem = pem;
    return { pem, changed };
  }
}
