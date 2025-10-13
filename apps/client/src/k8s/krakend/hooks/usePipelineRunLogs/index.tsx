import { trpc } from "@/core/clients/trpc";
import { useQuery } from "@tanstack/react-query";

interface OpensearchResponse {
  _shards: {
    failed: number;
    skipped: number;
    successful: number;
    total: number;
  };
  hits: {
    hits: {
      _id: string;
      _index: string;
      _score: number;
      _source: {
        kubernetes: {
          labels: Record<string, string>;
        };
        log: string;
      };
      sort: number[];
    }[];
    max_score: number;
    total: {
      relation: string;
      value: string;
    };
  };
  timed_out: boolean;
  took: number;
}

export interface NormalizedLogs {
  map: Record<string, string[]>;
  order: string[];
  all: string[];
}

export const normalizePipelineRunLogs = (response: OpensearchResponse): NormalizedLogs => {
  if (!response?.hits?.hits || !response.hits.hits.length) {
    return { map: {}, order: [], all: [] };
  }

  const result = (response?.hits?.hits || []).reduce<NormalizedLogs>(
    (acc, cur) => {
      const taskName = cur._source?.kubernetes?.labels?.["tekton_dev/pipelineTask"];

      if (!taskName) {
        return acc;
      }

      if (!acc.map[taskName]) {
        acc.map[taskName] = [];
        acc.order.push(taskName);
      }

      const logStr = `${cur._source.log}\n`;

      acc.map[taskName].push(logStr);
      acc.all.push(logStr);
      return acc;
    },
    { map: {}, order: [], all: [] }
  );

  return { map: result.map, order: result.order, all: result.all };
};

export const usePipelineRunLogsQuery = (clusterName: string, namespace: string, name: string) => {
  return useQuery<OpensearchResponse, Error, NormalizedLogs>({
    queryKey: ["pipelineRunLogs", clusterName, namespace, name],
    queryFn: () => {
      return trpc.krakend.getPipelineRunLogs.query({
        clusterName: clusterName,
        namespace: namespace,
        name: name,
      }) as Promise<OpensearchResponse>;
    },
    select: (data) => normalizePipelineRunLogs(data),
  });
};

export const normalizeAllPipelineRunLogs = (data: OpensearchResponse): NormalizedLogs => {
  // @ts-expect-error TODO: fix this
  if (data.aggregations && data.aggregations.unique_pipelineRuns && data.aggregations.unique_pipelineRuns.buckets) {
    // @ts-expect-error TODO: fix this
    return data.aggregations.unique_pipelineRuns.buckets.map((bucket) => bucket.key);
  }
  // @ts-expect-error TODO: fix this
  return [];
};

export const useAllPipelineRunLogsQuery = (clusterName: string, namespace: string) => {
  return useQuery<OpensearchResponse, Error, NormalizedLogs>({
    queryKey: ["pipelineRunLogs", clusterName, namespace],
    queryFn: () => {
      return trpc.krakend.getAllPipelineRunsLogs.query({
        clusterName: clusterName,
        namespace: namespace,
      }) as Promise<OpensearchResponse>;
    },
    select: (data) => normalizeAllPipelineRunLogs(data),
  });
};
