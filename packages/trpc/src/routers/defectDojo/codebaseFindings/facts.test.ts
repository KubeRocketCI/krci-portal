import { K8sApiError, k8sApplicationConfig, k8sStageConfig } from "@my-project/shared";
import { describe, expect, it, vi } from "vitest";
import { createKubeReader, type KubeObject } from "../__fixtures__/kubeReader.js";
import {
  DEMO_CLUSTER,
  DEMO_CODEBASE,
  DEMO_NAMESPACE,
  makeApplication,
  makeStage,
} from "../__fixtures__/testDoubles.js";
import { readCodebaseFacts, type CodebaseEnvironment } from "./facts.js";

const INPUT = { namespace: DEMO_NAMESPACE, name: DEMO_CODEBASE };

async function readEnvironments(
  objects: KubeObject[],
  options?: Parameters<typeof createKubeReader>[1]
): Promise<CodebaseEnvironment[]> {
  const facts = await readCodebaseFacts(createKubeReader([...DEMO_CLUSTER, ...objects], options), INPUT);
  return facts.environments;
}

function deployedTo(cdPipeline: string, stage: string, stageOptions: Parameters<typeof makeStage>[0] = {}) {
  return [
    makeApplication({ name: `${cdPipeline}-${stage}-demo-app`, pipeline: cdPipeline, stage }),
    makeStage({ cdPipeline, name: stage, namespace: `${cdPipeline}-${stage}`, ...stageOptions }),
  ];
}

describe("the Environments of a codebase", () => {
  it("are none for a codebase that no Application deploys", async () => {
    await expect(readEnvironments([])).resolves.toEqual([]);
  });

  it("are the Application and the Stage it names by its pipeline and stage labels", async () => {
    await expect(readEnvironments([makeApplication(), makeStage()])).resolves.toEqual([
      {
        cdPipeline: "demo",
        stage: "dev",
        clusterName: "in-cluster",
        namespace: "demo-dev",
        applicationName: "demo-dev-demo-app",
      },
    ]);
  });

  it("take the cluster of the Stage: a Stage on a remote cluster is read from the portal's cluster all the same", async () => {
    const [environment] = await readEnvironments(deployedTo("demo", "prod", { clusterName: "remote" }));

    expect(environment).toMatchObject({ stage: "prod", clusterName: "remote", namespace: "demo-prod" });
  });

  describe("are not made by", () => {
    it.each([
      ["an Application of another codebase", [makeApplication({ codebase: "other-app" }), makeStage()]],
      ["an Application without the pipeline label", [makeApplication({ pipeline: null }), makeStage()]],
      ["an Application without the stage label", [makeApplication({ stage: null }), makeStage()]],
      ["an Application whose Stage is missing", [makeApplication()]],
      [
        "an Application whose stage label names no Stage of its pipeline",
        [makeApplication({ stage: "qa" }), makeStage()],
      ],
      ["a Stage that no Application deploys to", [makeStage()]],
    ])("%s", async (_, objects) => {
      await expect(readEnvironments(objects)).resolves.toEqual([]);
    });

    it("an Application in another namespace than the codebase", async () => {
      await expect(readEnvironments([makeApplication({ namespace: "other-ns" }), makeStage()])).resolves.toEqual([]);
    });

    it("a Stage in another namespace than the codebase", async () => {
      await expect(
        readEnvironments([makeApplication(), makeStage({ platformNamespace: "other-ns" })])
      ).resolves.toEqual([]);
    });

    it.each([
      ["its CDPipeline", { name: "dev", namespace: "demo-dev", order: 0 }],
      ["its namespace", { cdPipeline: "demo", name: "dev", order: 0 }],
      ["its order", { cdPipeline: "demo", name: "dev", namespace: "demo-dev" }],
    ])("a Stage that lacks %s", async (_, spec) => {
      const brokenStage: KubeObject = { ...makeStage(), spec };

      await expect(readEnvironments([makeApplication(), brokenStage])).resolves.toEqual([]);
    });
  });

  it("keep the first Application by name when two name the same Stage", async () => {
    const environments = await readEnvironments([
      makeApplication({ name: "zeta-app" }),
      makeApplication({ name: "alpha-app" }),
      makeStage(),
    ]);

    expect(environments.map((environment) => environment.applicationName)).toEqual(["alpha-app"]);
  });

  it("are ordered by CDPipeline, then by the order of the Stage, then by its name", async () => {
    const environments = await readEnvironments([
      ...deployedTo("zeta", "dev", { order: 0 }),
      ...deployedTo("alpha", "prod", { order: 2 }),
      ...deployedTo("alpha", "qa", { order: 1 }),
      ...deployedTo("alpha", "dev", { order: 0 }),
      ...deployedTo("alpha", "stable", { order: 1 }),
    ]);

    expect(environments.map(({ cdPipeline, stage }) => `${cdPipeline}/${stage}`)).toEqual([
      "alpha/dev",
      "alpha/qa",
      "alpha/stable",
      "alpha/prod",
      "zeta/dev",
    ]);
  });
});

describe("what the Environments are read with", () => {
  it("is the Applications of the codebase by label, and the Stages, in the namespace of the codebase", async () => {
    const reader = createKubeReader(DEMO_CLUSTER);
    const listResource = vi.spyOn(reader, "listResource");

    await readCodebaseFacts(reader, INPUT);

    const requests = listResource.mock.calls.map(([config, namespace, labelSelector]) => ({
      kind: config.kind,
      namespace,
      labelSelector,
    }));
    expect(requests).toContainEqual({
      kind: k8sApplicationConfig.kind,
      namespace: "krci",
      labelSelector: "app.edp.epam.com/app-name=demo-app",
    });
    expect(requests).toContainEqual({ kind: k8sStageConfig.kind, namespace: "krci", labelSelector: undefined });
  });

  describe("a list that fails with 404 or 403", () => {
    it.each([
      ["the cluster does not serve the Applications", { notServed: [k8sApplicationConfig] }],
      ["the cluster does not serve the Stages", { notServed: [k8sStageConfig] }],
      ["the user may not list the Applications", { forbidden: [k8sApplicationConfig] }],
      ["the user may not list the Stages", { forbidden: [k8sStageConfig] }],
    ])("is no Environments when %s, and the rest of the facts are read", async (_, options) => {
      const facts = await readCodebaseFacts(
        createKubeReader([...DEMO_CLUSTER, makeApplication(), makeStage()], options),
        INPUT
      );

      expect(facts.environments).toEqual([]);
      expect(facts.branches).toEqual(["main"]);
    });
  });

  describe("a read that fails with anything but 404 or 403", () => {
    it("is rethrown for a server error", async () => {
      const reader = createKubeReader(DEMO_CLUSTER);
      vi.spyOn(reader, "listResource").mockImplementation(async (config) => {
        if (config.kind === k8sApplicationConfig.kind) {
          throw new K8sApiError(500, "Internal Server Error", "etcd is down");
        }
        return { items: [] };
      });

      await expect(readCodebaseFacts(reader, INPUT)).rejects.toMatchObject({ statusCode: 500 });
    });
  });
});
