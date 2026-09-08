import { TRPCError } from "@trpc/server";
import {
  KrciAuditEventsResponse,
  KrciAuditEventsQuery,
  KrciAuditFacetField,
  KrciAuditFacetsResponse,
  KrciAuditInitiator,
  krciAuditEventsResponseSchema,
  krciAuditFacetsResponseSchema,
  krciAuditInitiatorSchema,
} from "@my-project/shared";
import { createHttpService, withTRPCErrors, type HttpService } from "../http/index.js";

const DEFAULT_TIMEOUT_MS = 10_000; // single-object lookup, keep it snappy

interface KrciAuditConfig {
  apiBaseURL: string;
  timeoutMs: number;
}

function loadConfig(): KrciAuditConfig {
  return {
    apiBaseURL: process.env.KRCI_AUDIT_URL || "",
    timeoutMs: DEFAULT_TIMEOUT_MS,
  };
}

const config = loadConfig();

export function createKrciAuditClient(): KrciAuditClient {
  if (!config.apiBaseURL) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "KRCI_AUDIT_URL environment variable is not configured",
    });
  }

  return new KrciAuditClient({
    apiBaseURL: config.apiBaseURL,
    timeoutMs: config.timeoutMs,
  });
}

export interface KrciAuditClientConfig {
  apiBaseURL: string;
  timeoutMs?: number;
}

/**
 * Client for the krci-audit read API.
 *
 * Security model:
 * - krci-audit v1 is unprotected; access control is network-level only (ClusterIP, no Ingress)
 * - No authentication headers are sent
 */
export class KrciAuditClient {
  private readonly http: HttpService;

  constructor(clientConfig: KrciAuditClientConfig) {
    const { apiBaseURL, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("krci-audit API base URL is not configured");
    }

    // Wrapped: the audit procedures do not catch, so the upstream status must reach the browser
    // as a tRPC code. Response-schema failures stay raw ZodErrors.
    this.http = withTRPCErrors(createHttpService({ name: "krci-audit", baseURL: apiBaseURL, timeoutMs }));
  }

  /**
   * Resolve the CREATE actor for an object, identified either by its `metadata.uid` or by
   * `kind + namespace + name` (see krci-audit `oapi.yaml` getInitiator).
   *
   * Name-based lookup is the correct key for objects surfaced from Tekton Results history,
   * whose reconstructed `metadata.uid` is the Results aggregator id, not the K8s object uid.
   *
   * @returns `{found: false}` if the object was never audited (not an error)
   */
  async getInitiator(query: KrciAuditInitiatorQuery): Promise<KrciAuditInitiator> {
    return this.http.json("/api/v1/audit/initiator", { query: { ...query }, schema: krciAuditInitiatorSchema });
  }

  async getAuditEvents(query: KrciAuditEventsQuery): Promise<KrciAuditEventsResponse> {
    return this.http.json("/api/v1/audit/events", { query: { ...query }, schema: krciAuditEventsResponseSchema });
  }

  /**
   * Fetch the bounded (≤50, see `Facet.truncated`) set of distinct values krci-audit has
   * observed for each requested field, so the portal can offer a dropdown instead of free text.
   */
  async getFacets(fields: KrciAuditFacetField[]): Promise<KrciAuditFacetsResponse> {
    return this.http.json("/api/v1/audit/facets", {
      query: { fields: fields.join(",") },
      schema: krciAuditFacetsResponseSchema,
    });
  }
}

export type KrciAuditInitiatorQuery = { objectUid: string } | { kind: string; namespace: string; name: string };
