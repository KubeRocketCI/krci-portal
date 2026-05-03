import { TRPCError } from "@trpc/server";
import { promqlMatrixResponseSchema, promqlVectorResponseSchema, PROMETHEUS_TIMEOUT_MS } from "@my-project/shared";
import type { PromQLMatrixResponse, PromQLVectorResponse } from "@my-project/shared";
import type { ZodType } from "zod";

export interface PrometheusClientConfig {
  baseURL: string;
  timeoutMs: number;
}

/** Read PROMETHEUS_URL once at module load. */
function loadConfig(): { baseURL: string } {
  return {
    baseURL: (process.env.PROMETHEUS_URL || "").replace(/\/$/, ""),
  };
}

const moduleConfig = loadConfig();

export function createPrometheusClient(): PrometheusClient {
  if (!moduleConfig.baseURL) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PROMETHEUS_URL environment variable is not configured",
    });
  }
  return new PrometheusClient({
    baseURL: moduleConfig.baseURL,
    timeoutMs: PROMETHEUS_TIMEOUT_MS,
  });
}

export interface RangeQueryParams {
  query: string;
  /** Unix seconds. */
  start: number;
  /** Unix seconds. */
  end: number;
  /** Resolution in seconds; sent as `<step>s`. */
  step: number;
}

export interface InstantQueryParams {
  query: string;
}

export class PrometheusClient {
  private readonly baseURL: string;
  private readonly timeoutMs: number;

  constructor(config: PrometheusClientConfig) {
    if (!config.baseURL) {
      throw new Error("Prometheus base URL is not configured");
    }
    this.baseURL = config.baseURL;
    this.timeoutMs = config.timeoutMs;
  }

  async rangeQuery(params: RangeQueryParams, externalSignal?: AbortSignal): Promise<PromQLMatrixResponse> {
    const qs = new URLSearchParams({
      query: params.query,
      start: String(Math.floor(params.start)),
      end: String(Math.floor(params.end)),
      step: `${params.step}s`,
    }).toString();
    return this.fetchJson(`/api/v1/query_range?${qs}`, promqlMatrixResponseSchema, externalSignal);
  }

  async instantQuery(params: InstantQueryParams, externalSignal?: AbortSignal): Promise<PromQLVectorResponse> {
    const qs = new URLSearchParams({ query: params.query }).toString();
    return this.fetchJson(`/api/v1/query?${qs}`, promqlVectorResponseSchema, externalSignal);
  }

  private async fetchJson<T>(path: string, schema: ZodType<T>, externalSignal?: AbortSignal): Promise<T> {
    const url = `${this.baseURL}${path}`;
    const timeoutSignal = AbortSignal.timeout(this.timeoutMs);
    const signal = externalSignal ? AbortSignal.any([timeoutSignal, externalSignal]) : timeoutSignal;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(
          `Prometheus request failed: ${response.status} ${response.statusText}${text ? `\nResponse: ${text}` : ""}`
        );
      }

      const json = await response.json();
      return schema.parse(json);
    } catch (error) {
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        throw new Error(`Prometheus request timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    }
  }
}
