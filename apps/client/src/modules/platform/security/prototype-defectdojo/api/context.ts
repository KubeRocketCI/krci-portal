// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import type {
  PrototypeDefectDojoCountsResult,
  PrototypeDefectDojoFindingsResult,
  PrototypeDefectDojoListFindingsInput,
  PrototypeDefectDojoListProductsInput,
  PrototypeDefectDojoListTestsInput,
  PrototypeDefectDojoProductSetCountsInput,
  PrototypeDefectDojoProductSetCountsResult,
  PrototypeDefectDojoProductsResult,
  PrototypeDefectDojoSeverityCountsInput,
  PrototypeDefectDojoTestsResult,
} from "@my-project/shared";
import { createPrototypeRequestLog, type PrototypeRequestLog } from "./requestLog";

/** The read procedures of the `prototypeDefectDojo` tRPC router. */
export interface PrototypeDefectDojoApi {
  listProducts(input: PrototypeDefectDojoListProductsInput): Promise<PrototypeDefectDojoProductsResult>;
  listTests(input: PrototypeDefectDojoListTestsInput): Promise<PrototypeDefectDojoTestsResult>;
  severityCounts(input: PrototypeDefectDojoSeverityCountsInput): Promise<PrototypeDefectDojoCountsResult>;
  productSetCounts(input: PrototypeDefectDojoProductSetCountsInput): Promise<PrototypeDefectDojoProductSetCountsResult>;
  listFindings(input: PrototypeDefectDojoListFindingsInput): Promise<PrototypeDefectDojoFindingsResult>;
}

export interface PrototypeDefectDojoContextValue {
  /** `null`: the tRPC client. Stories pass a fixture-backed implementation. */
  api: PrototypeDefectDojoApi | null;
  /** Part of every query key. One value per variant keeps their caches apart. */
  cacheScope: string;
  log: PrototypeRequestLog;
}

export const PROTOTYPE_DEFECTDOJO_QUERY_KEY_ROOT = "prototypeDefectDojo";

export const PrototypeDefectDojoContext = React.createContext<PrototypeDefectDojoContextValue>({
  api: null,
  cacheScope: "default",
  log: createPrototypeRequestLog(),
});
