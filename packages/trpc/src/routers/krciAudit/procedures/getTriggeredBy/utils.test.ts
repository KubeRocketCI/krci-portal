import { describe, expect, it } from "vitest";
import { classifyTriggeredByActor } from "./utils.js";

describe("classifyTriggeredByActor", () => {
  it("classifies a human OIDC actor", () => {
    expect(
      classifyTriggeredByActor({ found: true, actor: "dev@example.com", operation: "CREATE", timestamp: "t" })
    ).toEqual({ actorClass: "human", actor: "dev@example.com", displayName: "dev@example.com" });
  });

  it("classifies a service-account actor and extracts its short name", () => {
    expect(
      classifyTriggeredByActor({
        found: true,
        actor: "system:serviceaccount:tekton-pipelines:tekton-triggers-sa",
        operation: "CREATE",
        timestamp: "t",
      })
    ).toEqual({
      actorClass: "automation",
      actor: "system:serviceaccount:tekton-pipelines:tekton-triggers-sa",
      displayName: "tekton-triggers-sa",
    });
  });

  it("classifies a non-ServiceAccount system principal as automation without a short name", () => {
    expect(
      classifyTriggeredByActor({
        found: true,
        actor: "system:kube-controller-manager",
        operation: "CREATE",
        timestamp: "t",
      })
    ).toEqual({
      actorClass: "automation",
      actor: "system:kube-controller-manager",
      displayName: "system:kube-controller-manager",
    });
  });

  it("classifies the system:unknown sentinel as unknown", () => {
    expect(
      classifyTriggeredByActor({ found: true, actor: "system:unknown", operation: "CREATE", timestamp: "t" })
    ).toEqual({ actorClass: "unknown" });
  });

  it("classifies found:false (never audited) as unknown", () => {
    expect(classifyTriggeredByActor({ found: false })).toEqual({ actorClass: "unknown" });
  });

  it("classifies an empty actor string as unknown", () => {
    expect(classifyTriggeredByActor({ found: true, actor: "" })).toEqual({ actorClass: "unknown" });
  });
});
