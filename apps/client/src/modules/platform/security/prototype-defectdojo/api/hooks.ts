// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  PrototypeDefectDojoListFindingsInput,
  PrototypeDefectDojoListProductsInput,
  PrototypeDefectDojoListTestsInput,
  PrototypeDefectDojoProductSetCountsInput,
  PrototypeDefectDojoSeverityCountsInput,
} from "@my-project/shared";
import { useTRPCClient } from "@/core/providers/trpc";
import {
  PROTOTYPE_DEFECTDOJO_QUERY_KEY_ROOT as QUERY_KEY_ROOT,
  PrototypeDefectDojoContext,
  type PrototypeDefectDojoApi,
} from "./context";

const QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: false,
} as const;

interface ResultWithRequests {
  state: string;
  requests?: string[];
}

/** The context API when a provider sets one, the tRPC client otherwise. Every call is written to the request log. */
function usePrototypeDefectDojoApi(): { api: PrototypeDefectDojoApi; cacheScope: string } {
  const { api: override, cacheScope, log } = React.useContext(PrototypeDefectDojoContext);
  const trpc = useTRPCClient();

  return React.useMemo(() => {
    const source: PrototypeDefectDojoApi = override ?? {
      listProducts: (input) => trpc.prototypeDefectDojo.listProducts.query(input),
      listTests: (input) => trpc.prototypeDefectDojo.listTests.query(input),
      severityCounts: (input) => trpc.prototypeDefectDojo.severityCounts.query(input),
      productSetCounts: (input) => trpc.prototypeDefectDojo.productSetCounts.query(input),
      listFindings: (input) => trpc.prototypeDefectDojo.listFindings.query(input),
    };

    async function logged<T extends ResultWithRequests>(procedure: string, call: Promise<T>): Promise<T> {
      const result = await call;
      log.record({ procedure, state: result.state, requests: result.requests ?? [] });
      return result;
    }

    const api: PrototypeDefectDojoApi = {
      listProducts: (input) => logged("listProducts", source.listProducts(input)),
      listTests: (input) => logged("listTests", source.listTests(input)),
      severityCounts: (input) => logged("severityCounts", source.severityCounts(input)),
      productSetCounts: (input) => logged("productSetCounts", source.productSetCounts(input)),
      listFindings: (input) => logged("listFindings", source.listFindings(input)),
    };

    return { api, cacheScope };
  }, [override, cacheScope, log, trpc]);
}

/** `input: null` disables the query. */
export function usePrototypeDefectDojoProducts(input: PrototypeDefectDojoListProductsInput | null) {
  const { api, cacheScope } = usePrototypeDefectDojoApi();

  return useQuery({
    queryKey: [QUERY_KEY_ROOT, cacheScope, "listProducts", input],
    queryFn: () => api.listProducts(input!),
    enabled: input !== null,
    ...QUERY_OPTIONS,
  });
}

/** One `listProducts` query per input, in input order. */
export function usePrototypeDefectDojoProductLists(inputs: PrototypeDefectDojoListProductsInput[]) {
  const { api, cacheScope } = usePrototypeDefectDojoApi();

  return useQueries({
    queries: inputs.map((input) => ({
      queryKey: [QUERY_KEY_ROOT, cacheScope, "listProducts", input],
      queryFn: () => api.listProducts(input),
      ...QUERY_OPTIONS,
    })),
  });
}

/** One `listTests` query per input, in input order. */
export function usePrototypeDefectDojoTestLists(inputs: PrototypeDefectDojoListTestsInput[]) {
  const { api, cacheScope } = usePrototypeDefectDojoApi();

  return useQueries({
    queries: inputs.map((input) => ({
      queryKey: [QUERY_KEY_ROOT, cacheScope, "listTests", input],
      queryFn: () => api.listTests(input),
      ...QUERY_OPTIONS,
    })),
  });
}

/** `input: null` disables the query. */
export function usePrototypeDefectDojoSeverityCounts(input: PrototypeDefectDojoSeverityCountsInput | null) {
  const { api, cacheScope } = usePrototypeDefectDojoApi();

  return useQuery({
    queryKey: [QUERY_KEY_ROOT, cacheScope, "severityCounts", input],
    queryFn: () => api.severityCounts(input!),
    enabled: input !== null,
    ...QUERY_OPTIONS,
  });
}

/** `input: null` disables the query. */
export function usePrototypeDefectDojoProductSetCounts(input: PrototypeDefectDojoProductSetCountsInput | null) {
  const { api, cacheScope } = usePrototypeDefectDojoApi();

  return useQuery({
    queryKey: [QUERY_KEY_ROOT, cacheScope, "productSetCounts", input],
    queryFn: () => api.productSetCounts(input!),
    enabled: input !== null,
    ...QUERY_OPTIONS,
  });
}

/** `input: null` disables the query. */
export function usePrototypeDefectDojoFindings(input: PrototypeDefectDojoListFindingsInput | null) {
  const { api, cacheScope } = usePrototypeDefectDojoApi();

  return useQuery({
    queryKey: [QUERY_KEY_ROOT, cacheScope, "listFindings", input],
    queryFn: () => api.listFindings(input!),
    enabled: input !== null,
    ...QUERY_OPTIONS,
  });
}

/** Drops the cached reads of the current cache scope, clears its request log and refetches mounted queries. */
export function usePrototypeDefectDojoReset() {
  const { cacheScope, log } = React.useContext(PrototypeDefectDojoContext);
  const queryClient = useQueryClient();

  return React.useCallback(() => {
    log.clear();
    return queryClient.resetQueries({ queryKey: [QUERY_KEY_ROOT, cacheScope] });
  }, [cacheScope, log, queryClient]);
}
