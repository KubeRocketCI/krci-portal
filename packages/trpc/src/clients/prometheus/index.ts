import { TRPCError } from "@trpc/server";
import {
  promqlMatrixResponseSchema,
  promqlVectorResponseSchema,
  PROMETHEUS_TIMEOUT_MS,
  stripTrailingSlash,
} from "@my-project/shared";
import type { PromQLMatrixResponse, PromQLVectorResponse } from "@my-project/shared";
import { createHttpService, type HttpService } from "../http/index.js";

export interface PrometheusClientConfig {
  baseURL: string;
  timeoutMs: number;
}

/** Read PROMETHEUS_URL once at module load. */
function loadConfig(): { baseURL: string } {
  return {
    baseURL: stripTrailingSlash(process.env.PROMETHEUS_URL),
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
  private readonly http: HttpService;

  constructor(config: PrometheusClientConfig) {
    if (!config.baseURL) {
      throw new Error("Prometheus base URL is not configured");
    }

    this.http = createHttpService({
      name: "Prometheus",
      baseURL: config.baseURL,
      timeoutMs: config.timeoutMs,
    });
  }

  async rangeQuery(params: RangeQueryParams, externalSignal?: AbortSignal): Promise<PromQLMatrixResponse> {
    return this.http.json("/api/v1/query_range", {
      query: {
        query: params.query,
        start: Math.floor(params.start),
        end: Math.floor(params.end),
        step: `${params.step}s`,
      },
      schema: promqlMatrixResponseSchema,
      signal: externalSignal,
    });
  }

  async instantQuery(params: InstantQueryParams, externalSignal?: AbortSignal): Promise<PromQLVectorResponse> {
    return this.http.json("/api/v1/query", {
      query: { query: params.query },
      schema: promqlVectorResponseSchema,
      signal: externalSignal,
    });
  }
}
