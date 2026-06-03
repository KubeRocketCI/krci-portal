import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildTokenInfoFromToken } from "./index.js";

const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const makeJwt = (payload: object) => `${b64url({ alg: "none", typ: "JWT" })}.${b64url(payload)}.sig`;

const ONE_HOUR_S = 3600;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

describe("buildTokenInfoFromToken", () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses the JWT exp claim when present and within the cap", () => {
    const expSec = Math.floor(NOW / 1000) + ONE_HOUR_S;
    const token = makeJwt({ exp: expSec });

    const info = buildTokenInfoFromToken(token);

    expect(info.idToken).toBe(token);
    expect(info.accessToken).toBe(token);
    expect(info.refreshToken).toBe("");
    expect(info.idTokenExpiresAt).toBe(expSec * 1000);
    expect(info.accessTokenExpiresAt).toBe(expSec * 1000);
  });

  it("falls back to the 5-minute default for opaque (non-JWT) tokens", () => {
    const info = buildTokenInfoFromToken("opaque-token");

    expect(info.idTokenExpiresAt).toBe(NOW + 5 * 60 * 1000);
  });

  it("falls back to the provided default for tokens without an exp claim", () => {
    const token = makeJwt({ sub: "no-exp" });

    const info = buildTokenInfoFromToken(token, 7000);

    expect(info.idTokenExpiresAt).toBe(NOW + 7000);
  });

  it("gives a legacy (no-exp) SA token a full 24h session when passed the SA default", () => {
    const token = makeJwt({ sub: "legacy-sa" });

    const info = buildTokenInfoFromToken(token, TWENTY_FOUR_HOURS_MS);

    expect(info.idTokenExpiresAt).toBe(NOW + TWENTY_FOUR_HOURS_MS);
  });

  it("caps a far-future exp claim at 24h", () => {
    const expSec = Math.floor(NOW / 1000) + 48 * ONE_HOUR_S;
    const token = makeJwt({ exp: expSec });

    const info = buildTokenInfoFromToken(token);

    expect(info.idTokenExpiresAt).toBe(NOW + TWENTY_FOUR_HOURS_MS);
  });
});
