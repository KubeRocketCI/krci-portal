// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import type { PrototypeDefectDojoScopeCounts } from "@my-project/shared";
import {
  usePrototypeDefectDojoProductLists,
  usePrototypeDefectDojoSeverityCounts,
  usePrototypeDefectDojoTestLists,
} from "@/modules/platform/security/prototype-defectdojo/api/hooks";
import { buildRuntimeWorkloads, environmentTags } from "../model";
import type {
  EnvironmentFindings,
  EnvironmentFindingsState,
  PipelineFindingsModel,
  PipelineFindingsScope,
  RuntimeWorkload,
} from "../types";

/**
 * DefectDojo side of the Environment pieces, for every Environment of the scope.
 * Requests: one `listProducts` per Environment, one `severityCounts` for the products found,
 * one `listTests` per Environment of `testsForStages`, one `severityCounts` for their running tests.
 * Two components under one provider that pass equal arguments share the requests.
 *
 * @param options.testsForStages - Stage names whose workloads are read.
 * @param options.withInactive - also count the findings that are not active (one more upstream request per test).
 */
export function usePipelineFindingsModel(
  pipeline: PipelineFindingsScope,
  options: { testsForStages: string[]; withInactive: boolean }
): PipelineFindingsModel {
  const environments = pipeline.environments;
  const testStages = options.testsForStages.join("|");

  const productQueries = usePrototypeDefectDojoProductLists(
    React.useMemo(() => environments.map((environment) => ({ tags: environmentTags(environment) })), [environments])
  );

  const testEnvironments = React.useMemo(
    () => environments.filter((environment) => testStages.split("|").includes(environment.stage)),
    [environments, testStages]
  );
  const testQueries = usePrototypeDefectDojoTestLists(
    React.useMemo(
      () => testEnvironments.map((environment) => ({ tags: environmentTags(environment) })),
      [testEnvironments]
    )
  );

  const products = productQueries.map((query) => (query.data?.state === "data" ? (query.data.data[0] ?? null) : null));
  const productIds = products.flatMap((product) => (product ? [product.id] : [])).sort((left, right) => left - right);
  // One counts call for all ids: it waits until every list has answered.
  const productsSettled = productQueries.every((query) => !query.isLoading);
  const productCountsQuery = usePrototypeDefectDojoSeverityCounts(
    productsSettled && productIds.length > 0 ? { productIds } : null
  );

  const workloadsByStage = new Map<string, RuntimeWorkload[]>();
  testEnvironments.forEach((environment, index) => {
    const result = testQueries[index]?.data;
    workloadsByStage.set(
      environment.stage,
      result?.state === "data" ? buildRuntimeWorkloads(environment, result.data) : []
    );
  });

  const testIds = [...workloadsByStage.values()]
    .flat()
    .filter((workload) => !workload.notRunning)
    .flatMap((workload) => workload.tests.map((test) => test.id))
    .sort((left, right) => left - right);
  const testsSettled = testQueries.every((query) => !query.isLoading);
  const testCountsQuery = usePrototypeDefectDojoSeverityCounts(
    testsSettled && testIds.length > 0 ? { testIds, withInactive: options.withInactive } : null
  );

  const counts = React.useMemo(() => {
    const byTest = new Map<number, PrototypeDefectDojoScopeCounts>();
    if (testCountsQuery.data?.state === "data") {
      for (const item of testCountsQuery.data.data) {
        byTest.set(item.id, item);
      }
    }
    return byTest;
  }, [testCountsQuery.data]);

  const productCounts = new Map<number, PrototypeDefectDojoScopeCounts>();
  if (productCountsQuery.data?.state === "data") {
    for (const item of productCountsQuery.data.data) {
      productCounts.set(item.id, item);
    }
  }

  const environmentFindings: EnvironmentFindings[] = environments.map((scope, index) => {
    const productQuery = productQueries[index];
    const testQuery = testQueries[testEnvironments.indexOf(scope)];
    const product = products[index];

    let state: EnvironmentFindingsState = "data";
    if (productQuery.isLoading || testQuery?.isLoading) {
      state = "loading";
    } else if (
      productQuery.isError ||
      productQuery.data?.state === "unreachable" ||
      testQuery?.isError ||
      testQuery?.data?.state === "unreachable"
    ) {
      state = "unreachable";
    } else if (!product) {
      state = "noData";
    }

    return {
      scope,
      state,
      product,
      productCounts: product ? (productCounts.get(product.id)?.active ?? null) : null,
      workloads: workloadsByStage.get(scope.stage) ?? null,
    };
  });

  const allQueries = [...productQueries, ...testQueries];
  let connection: PipelineFindingsModel["connection"] = "ready";
  if (allQueries.some((query) => query.data?.state === "notConfigured")) {
    connection = "notConfigured";
  } else if (productQueries.some((query) => query.isLoading)) {
    connection = "loading";
  }

  const retry = () => {
    for (const query of allQueries) {
      void query.refetch();
    }
    if (productIds.length > 0) {
      void productCountsQuery.refetch();
    }
    if (testIds.length > 0) {
      void testCountsQuery.refetch();
    }
  };

  return { connection, environments: environmentFindings, counts, retry };
}
