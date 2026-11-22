import { Code, ConnectError } from "@connectrpc/connect";
import { AgentSubstrateSourceError, type AgentSubstrateSourceErrorKind } from "../source.js";

const KIND_BY_CODE: Partial<Record<Code, AgentSubstrateSourceErrorKind>> = {
  [Code.Unauthenticated]: "unauthenticated",
  [Code.PermissionDenied]: "permissionDenied",
  [Code.NotFound]: "notFound",
  [Code.Unavailable]: "unavailable",
  [Code.DeadlineExceeded]: "unavailable",
};

/** Node `code` of a socket, DNS or TLS failure: E* (ECONNREFUSED, EAI_FAIL), ERR_TLS_*, ERR_SSL_*, ERR_OSSL_*, OpenSSL verify codes. */
const NETWORK_OR_TLS_CODE =
  /^((?!ERR_)E[A-Z_]+|ERR_TLS_.+|ERR_SSL_.+|ERR_OSSL_.+|UNABLE_TO_.+|DEPTH_ZERO_SELF_SIGNED_CERT|SELF_SIGNED_CERT_IN_CHAIN|CERT_.+|HOSTNAME_MISMATCH)$/;

function hasNetworkOrTlsCause(error: unknown): boolean {
  for (let current = error, depth = 0; current instanceof Error && depth < 8; current = current.cause, depth++) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && NETWORK_OR_TLS_CODE.test(code)) return true;
  }
  return false;
}

/** gRPC code to port error. A network or TLS failure is `unavailable` whatever code Connect gave it. */
export function toSourceError(error: unknown): AgentSubstrateSourceError {
  if (error instanceof AgentSubstrateSourceError) return error;

  const connectError = ConnectError.from(error);
  const kind = hasNetworkOrTlsCause(connectError) ? "unavailable" : (KIND_BY_CODE[connectError.code] ?? "other");
  return new AgentSubstrateSourceError(kind, connectError.message, { cause: error });
}
