import { describe, it, expect } from "vitest";
import { mapSelfSubjectReviewToOIDCUser } from "./index.js";

describe("mapSelfSubjectReviewToOIDCUser", () => {
  it("parses namespace and SA name from a service account username", () => {
    const user = mapSelfSubjectReviewToOIDCUser({
      username: "system:serviceaccount:edp-delivery:edp-admin",
      uid: "uid-123",
      groups: ["system:serviceaccounts", "system:serviceaccounts:edp-delivery", "system:authenticated"],
    });

    expect(user.sub).toBe("uid-123");
    expect(user.name).toBe("edp-admin");
    expect(user.preferred_username).toBe("system:serviceaccount:edp-delivery:edp-admin");
    expect(user.email).toBe("");
    expect(user.default_namespace).toBe("edp-delivery");
    expect(user.groups).toEqual([
      "system:serviceaccounts",
      "system:serviceaccounts:edp-delivery",
      "system:authenticated",
    ]);
  });

  it("falls back to the username for sub when uid is missing", () => {
    const user = mapSelfSubjectReviewToOIDCUser({ username: "system:serviceaccount:ns:sa" });

    expect(user.sub).toBe("system:serviceaccount:ns:sa");
    expect(user.groups).toEqual([]);
  });

  it("handles non-service-account usernames without a default namespace", () => {
    const user = mapSelfSubjectReviewToOIDCUser({ username: "kube-admin", uid: "abc" });

    expect(user.name).toBe("kube-admin");
    expect(user.preferred_username).toBe("kube-admin");
    expect(user.default_namespace).toBeUndefined();
  });

  it("always populates a non-empty sub (tektonResults cache-key safety)", () => {
    // An empty sub would collapse every SA into the shared "anonymous" cache bucket.
    expect(mapSelfSubjectReviewToOIDCUser({ username: "system:serviceaccount:ns:sa" }).sub).toBeTruthy();
    expect(mapSelfSubjectReviewToOIDCUser({ uid: "only-uid" }).sub).toBe("only-uid");
  });
});
