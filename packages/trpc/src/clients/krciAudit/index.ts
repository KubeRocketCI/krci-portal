import { TRPCError } from "@trpc/server";
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc";
import {
  KrciAuditEventsResponse,
  KrciAuditEventsQuery,
  KrciAuditFacetField,
  KrciAuditFacetsResponse,
  KrciAuditInitiator,
  krciAuditEventsResponseSchema,
  krciAuditFacetsResponseSchema,
  krciAuditInitiatorSchema,
  stripTrailingSlash,
} from "@my-project/shared";

const DEFAULT_TIMEOUT_MS = 10_000; // single-object lookup, keep it snappy

const HTTP_STATUS_TO_TRPC_CODE: Record<number, TRPC_ERROR_CODE_KEY> = {
  400: "BAD_REQUEST",
  // 401 → FORBIDDEN (not UNAUTHORIZED): UNAUTHORIZED triggers the portal login redirect,
  // but a krci-audit auth failure is a downstream issue, not an expired portal session.
  401: "FORBIDDEN",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  408: "TIMEOUT",
  429: "TOO_MANY_REQUESTS",
};

function getTRPCErrorCode(httpStatusCode: number): TRPC_ERROR_CODE_KEY {
  return HTTP_STATUS_TO_TRPC_CODE[httpStatusCode] ?? "INTERNAL_SERVER_ERROR";
}

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
  private readonly apiBaseURL: string;
  private readonly timeoutMs: number;

  constructor(clientConfig: KrciAuditClientConfig) {
    const { apiBaseURL, timeoutMs = DEFAULT_TIMEOUT_MS } = clientConfig;

    if (!apiBaseURL) {
      throw new Error("krci-audit API base URL is not configured");
    }

    this.apiBaseURL = stripTrailingSlash(apiBaseURL);
    this.timeoutMs = timeoutMs;
  }

  private buildEndpoint(path: string, params: Record<string, string>): string {
    const queryString = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== "")).toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  private async fetchJson<T>(endpoint: string): Promise<T> {
    const url = `${this.apiBaseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        await this.handleErrorResponse(response, url);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new TRPCError({
          code: "TIMEOUT",
          message: `krci-audit API request timed out after ${this.timeoutMs}ms`,
        });
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async handleErrorResponse(response: Response, url: string): Promise<never> {
    let errorText = "";
    try {
      errorText = await response.text();
    } catch {
      errorText = "Unable to read error response";
    }

    const errorMessage = `krci-audit API request failed: ${response.status} ${response.statusText}`;

    console.error(`[krci-audit] Error - URL: ${url}`);
    console.error(`[krci-audit] Status: ${response.status} ${response.statusText}`);
    if (errorText) {
      console.error(`[krci-audit] Response Body: ${errorText}`);
    }

    throw new TRPCError({
      code: getTRPCErrorCode(response.status),
      message: errorText ? `${errorMessage}\nResponse: ${errorText}` : errorMessage,
    });
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
    const endpoint = this.buildEndpoint("/api/v1/audit/initiator", { ...query });
    const raw = await this.fetchJson<unknown>(endpoint);

    return krciAuditInitiatorSchema.parse(raw);
  }

  async getAuditEvents(query: KrciAuditEventsQuery): Promise<KrciAuditEventsResponse> {
    const endpoint = this.buildEndpoint("/api/v1/audit/events", toQueryParamStrings(query));
    const raw = await this.fetchJson<unknown>(endpoint);

    return krciAuditEventsResponseSchema.parse(raw);
  }

  /**
   * Fetch the bounded (≤50, see `Facet.truncated`) set of distinct values krci-audit has
   * observed for each requested field, so the portal can offer a dropdown instead of free text.
   */
  async getFacets(fields: KrciAuditFacetField[]): Promise<KrciAuditFacetsResponse> {
    const endpoint = this.buildEndpoint("/api/v1/audit/facets", { fields: fields.join(",") });
    const raw = await this.fetchJson<unknown>(endpoint);

    return krciAuditFacetsResponseSchema.parse(raw);
  }
}

export type KrciAuditInitiatorQuery = { objectUid: string } | { kind: string; namespace: string; name: string };

function toQueryParamStrings(query: KrciAuditEventsQuery): Record<string, string> {
  return Object.entries(query).reduce<Record<string, string>>((params, [key, value]) => {
    if (value !== undefined && value !== null) {
      params[key] = String(value);
    }
    return params;
  }, {});
}
