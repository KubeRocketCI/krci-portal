// PROTOTYPE (EPMDEDP-16072): throwaway. Not for main.
import React from "react";
import type { PrototypeDefectDojoScopeCounts, PrototypeDefectDojoTestsResult } from "@my-project/shared";
import {
  usePrototypeDefectDojoSeverityCounts,
  usePrototypeDefectDojoTestLists,
} from "@/modules/platform/security/prototype-defectdojo/api/hooks";
import { buildCiTargets, buildRuntimeTargets, ciTestTags, runtimeTestTags } from "../model";
import type { CodebaseFindingsModel, CodebaseFindingsScope, LevelState, ScanTarget } from "../types";

interface TestListRead {
  isLoading: boolean;
  isError: boolean;
  data: PrototypeDefectDojoTestsResult | undefined;
}

function readState(reads: TestListRead[], targets: ScanTarget[]): LevelState {
  if (reads.some((read) => read.isLoading)) {
    return "loading";
  }
  if (reads.some((read) => read.isError || read.data?.state === "unreachable")) {
    return "unreachable";
  }
  return targets.length > 0 ? "data" : "noData";
}

/**
 * DefectDojo side of the codebase tab.
 * Requests: one `listTests` for the CI tests, one `listTests` per Environment, one `severityCounts`
 * for every test found.
 *
 * @param options.withInactive - also count the findings that are not active (one more upstream request per test).
 */
export function useCodebaseFindingsModel(
  scope: CodebaseFindingsScope,
  options: { withInactive: boolean }
): CodebaseFindingsModel {
  const testListInputs = React.useMemo(
    () => [
      { tags: ciTestTags(scope) },
      ...scope.environments.map((environment) => ({ tags: runtimeTestTags(environment) })),
    ],
    [scope]
  );

  const testListQueries = usePrototypeDefectDojoTestLists(testListInputs);
  const [ciQuery, ...runtimeQueries] = testListQueries;

  const ciTargets = ciQuery.data?.state === "data" ? buildCiTargets(scope, ciQuery.data.data) : [];

  const runtimeTargets = scope.environments.flatMap((environment, index) => {
    const result = runtimeQueries[index]?.data;
    return result?.state === "data" ? buildRuntimeTargets(scope, environment, result.data) : [];
  });

  const testIds = [...ciTargets, ...runtimeTargets]
    .filter((target) => !target.notRunning)
    .flatMap((target) => target.tests.map((test) => test.id))
    .sort((left, right) => left - right);

  // One counts call for all tests: it waits until every test list has answered.
  const testListsSettled = testListQueries.every((query) => !query.isLoading);
  const countsQuery = usePrototypeDefectDojoSeverityCounts(
    testListsSettled && testIds.length > 0 ? { testIds, withInactive: options.withInactive } : null
  );

  const counts = React.useMemo(() => {
    const byTest = new Map<number, PrototypeDefectDojoScopeCounts>();
    if (countsQuery.data?.state === "data") {
      for (const item of countsQuery.data.data) {
        if (item.scope === "test") {
          byTest.set(item.id, item);
        }
      }
    }
    return byTest;
  }, [countsQuery.data]);

  const codeTargets = ciTargets.filter((target) => target.level === "code");
  const imageTargets = ciTargets.filter((target) => target.level === "image");

  const notConfigured = testListQueries.some((query) => query.data?.state === "notConfigured");
  const isLoading = testListQueries.some((query) => query.isLoading);

  const refetchTestLists = () => {
    for (const query of testListQueries) {
      void query.refetch();
    }
    if (testIds.length > 0) {
      void countsQuery.refetch();
    }
  };

  let connection: CodebaseFindingsModel["connection"] = "ready";
  if (notConfigured) {
    connection = "notConfigured";
  } else if (isLoading) {
    connection = "loading";
  }

  return {
    connection,
    levels: {
      code: { level: "code", state: readState([ciQuery], codeTargets), targets: codeTargets },
      image: { level: "image", state: readState([ciQuery], imageTargets), targets: imageTargets },
      runtime: { level: "runtime", state: readState(runtimeQueries, runtimeTargets), targets: runtimeTargets },
    },
    counts,
    countsUnreachable: countsQuery.isError || countsQuery.data?.state === "unreachable",
    retry: refetchTestLists,
  };
}
