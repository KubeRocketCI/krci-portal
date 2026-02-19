import { useTRPCClient } from "@/core/providers/trpc";
import { useClusterStore } from "@/k8s/store";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  TektonRecordsListResponse,
  TektonResult,
  TektonResultRecord,
  TektonResultStatus,
  DecodedPipelineRun,
} from "@my-project/shared";
import React from "react";
import { useShallow } from "zustand/react/shallow";

export interface UseTektonRecordsOptions {
  filter?: string;
  pageSize?: number;
  orderBy?: string;
}

export interface NormalizedTektonRecords {
  items: TektonResult[];
  hasNextPage: boolean;
  totalLoaded: number;
}

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_ORDER_BY = "create_time desc";

const convertRecordToResult = (record: TektonResultRecord): TektonResult | null => {
  try {
    const decodedData: DecodedPipelineRun = JSON.parse(atob(record.data.value));

    const status: TektonResultStatus =
      decodedData.status?.conditions?.[0]?.status === "True"
        ? "SUCCESS"
        : decodedData.status?.conditions?.[0]?.status === "False"
          ? "FAILURE"
          : "UNKNOWN";

    const annotations: Record<string, unknown> = {
      ...decodedData.metadata.labels,
      ...decodedData.metadata.annotations,
      "object.metadata.name": decodedData.metadata.name,
    };

    const result: TektonResult = {
      uid: record.uid,
      name: record.name,
      create_time: record.create_time,
      update_time: record.update_time,
      annotations,
      summary: {
        record: record.name,
        type: "PIPELINE_RUN",
        status,
        start_time: decodedData.status?.startTime,
        end_time: decodedData.status?.completionTime,
        annotations,
      },
    };

    return result;
  } catch (error) {
    console.error("Failed to convert record to result:", error);
    return null;
  }
};

export const useTektonRecordsInfiniteQuery = (namespace: string, options?: UseTektonRecordsOptions) => {
  const trpc = useTRPCClient();
  const { clusterName } = useClusterStore(useShallow((state) => ({ clusterName: state.clusterName })));
  const pageSize = options?.pageSize ?? DEFAULT_PAGE_SIZE;
  const orderBy = options?.orderBy ?? DEFAULT_ORDER_BY;

  const query = useInfiniteQuery<TektonRecordsListResponse, Error>({
    queryKey: ["tektonRecords", "infinite", clusterName, namespace, options?.filter, pageSize, orderBy],
    queryFn: ({ pageParam }) => {
      return trpc.tektonResults.listRecords.query({
        namespace,
        filter: options?.filter,
        pageSize,
        pageToken: pageParam as string | undefined,
        orderBy,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.next_page_token || undefined;
    },
  });

  const normalizedData: NormalizedTektonRecords | undefined = React.useMemo(() => {
    if (!query.data) {
      return undefined;
    }

    const allRecords = query.data.pages.flatMap((page) => page.records || []);
    const convertedResults = allRecords.map(convertRecordToResult).filter((r): r is TektonResult => r !== null);

    return {
      items: convertedResults,
      hasNextPage: query.hasNextPage,
      totalLoaded: convertedResults.length,
    };
  }, [query.data, query.hasNextPage]);

  return {
    ...query,
    data: normalizedData,
  };
};
