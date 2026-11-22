import { Code, ConnectError } from "@connectrpc/connect";
import { describe, expect, it } from "vitest";
import { toSourceError } from "./errors.js";

function internalErrorCausedBy(code: string) {
  const cause = Object.assign(new Error(`node error ${code}`), { code });
  return new ConnectError("request failed", Code.Internal, undefined, undefined, cause);
}

describe("toSourceError", () => {
  it.each([
    "ECONNREFUSED",
    "EAI_FAIL",
    "ERR_TLS_CERT_ALTNAME_INVALID",
    "ERR_OSSL_PEM_NO_START_LINE",
    "CERT_HAS_EXPIRED",
  ])("maps a %s cause to unavailable", (code) => {
    expect(toSourceError(internalErrorCausedBy(code)).kind).toBe("unavailable");
  });

  it.each(["ERR_INVALID_ARG_TYPE", "ERR_STREAM_PREMATURE_CLOSE"])("maps a %s cause to other", (code) => {
    expect(toSourceError(internalErrorCausedBy(code)).kind).toBe("other");
  });
});
