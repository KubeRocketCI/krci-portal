import { describe, expect, it } from "vitest";
import { applyTaskRunServiceAccount, resolveServiceAccountName } from "./index.js";
import { Pipeline } from "../../../Pipeline/types.js";
import { TriggerTemplate } from "../../../TriggerTemplate/types.js";

const pipelineWithAnnotation = (value?: string) =>
  ({
    apiVersion: "tekton.dev/v1",
    kind: "Pipeline",
    metadata: {
      name: "github-go-beego-app-build-default",
      namespace: "krci",
      ...(value === undefined ? {} : { annotations: { "app.edp.epam.com/service-account": value } }),
    },
    spec: {},
  }) as unknown as Pipeline;

const triggerTemplateWithDefault = (def?: string) =>
  ({
    apiVersion: "triggers.tekton.dev/v1beta1",
    kind: "TriggerTemplate",
    metadata: { name: "github-build-template", namespace: "krci" },
    spec: {
      params: [{ name: "codebase" }, ...(def === undefined ? [] : [{ name: "serviceAccount", default: def }])],
      resourcetemplates: [],
    },
  }) as unknown as TriggerTemplate;

const draft = (serviceAccountName?: string) => ({
  spec: {
    ...(serviceAccountName === undefined ? {} : { taskRunTemplate: { serviceAccountName } }),
  },
});

describe("resolveServiceAccountName", () => {
  it("prefers the Pipeline annotation over the TriggerTemplate default", () => {
    expect(
      resolveServiceAccountName({
        pipeline: pipelineWithAnnotation("tekton"),
        triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
        paramName: "serviceAccount",
      })
    ).toBe("tekton");
  });

  it("falls back to the TriggerTemplate param default when the annotation is absent", () => {
    expect(
      resolveServiceAccountName({
        pipeline: pipelineWithAnnotation(),
        triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
        paramName: "serviceAccount",
      })
    ).toBe("tekton-unprivileged");
  });

  it("treats a blank annotation as absent", () => {
    expect(
      resolveServiceAccountName({
        pipeline: pipelineWithAnnotation("   "),
        triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
        paramName: "serviceAccount",
      })
    ).toBe("tekton-unprivileged");
  });

  it("trims surrounding whitespace", () => {
    expect(
      resolveServiceAccountName({
        pipeline: pipelineWithAnnotation(" tekton-cd\n"),
        paramName: "serviceAccount",
      })
    ).toBe("tekton-cd");
  });

  it("returns undefined when neither source resolves", () => {
    expect(
      resolveServiceAccountName({
        pipeline: pipelineWithAnnotation(),
        triggerTemplate: triggerTemplateWithDefault(),
        paramName: "serviceAccount",
      })
    ).toBeUndefined();
  });

  it("matches the TriggerTemplate default by param name", () => {
    expect(
      resolveServiceAccountName({
        triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
        paramName: "somethingElse",
      })
    ).toBeUndefined();
  });
});

describe("applyTaskRunServiceAccount", () => {
  it("replaces the placeholder with the Pipeline annotation value", () => {
    const d = draft("$(tt.params.serviceAccount)");

    applyTaskRunServiceAccount(d, {
      pipeline: pipelineWithAnnotation("tekton"),
      triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
    });

    expect(d.spec.taskRunTemplate?.serviceAccountName).toBe("tekton");
  });

  it("replaces the placeholder with the TriggerTemplate default when unannotated", () => {
    const d = draft("$(tt.params.serviceAccount)");

    applyTaskRunServiceAccount(d, {
      pipeline: pipelineWithAnnotation(),
      triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
    });

    expect(d.spec.taskRunTemplate?.serviceAccountName).toBe("tekton-unprivileged");
  });

  it("leaves a concrete ServiceAccount untouched", () => {
    const d = draft("tekton-security");

    applyTaskRunServiceAccount(d, {
      pipeline: pipelineWithAnnotation("tekton"),
      triggerTemplate: triggerTemplateWithDefault("tekton-unprivileged"),
    });

    expect(d.spec.taskRunTemplate?.serviceAccountName).toBe("tekton-security");
  });

  it("leaves a pre-hardening chart's literal 'tekton' untouched", () => {
    const d = draft("tekton");

    applyTaskRunServiceAccount(d, { pipeline: pipelineWithAnnotation("tekton-unprivileged") });

    expect(d.spec.taskRunTemplate?.serviceAccountName).toBe("tekton");
  });

  it("drops an unresolvable placeholder instead of shipping it to the apiserver", () => {
    const d = draft("$(tt.params.serviceAccount)");

    applyTaskRunServiceAccount(d, {
      pipeline: pipelineWithAnnotation(),
      triggerTemplate: triggerTemplateWithDefault(),
    });

    expect(d.spec.taskRunTemplate).toBeUndefined();
  });

  it("keeps sibling taskRunTemplate keys when dropping an unresolvable placeholder", () => {
    const d = {
      spec: {
        taskRunTemplate: { serviceAccountName: "$(tt.params.serviceAccount)", podTemplate: { nodeSelector: {} } },
      },
    };

    applyTaskRunServiceAccount(d, {});

    expect(d.spec.taskRunTemplate).toEqual({ podTemplate: { nodeSelector: {} } });
  });

  it("is a no-op when the draft has no taskRunTemplate", () => {
    const d = draft();

    expect(() => applyTaskRunServiceAccount(d, { pipeline: pipelineWithAnnotation("tekton") })).not.toThrow();
    expect(d.spec).toEqual({});
  });
});
