import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { K8sApiError } from "@my-project/shared";
import { K8sClient } from "../../clients/k8s/index.js";
import { authenticateServiceAccountToken } from "./index.js";

vi.mock("../../clients/k8s/index.js", () => ({
  K8sClient: { fromToken: vi.fn() },
}));

const mockFromToken = K8sClient.fromToken as unknown as Mock;

function stubClient(opts: {
  kubeConfig?: unknown;
  initError?: string | null;
  review?: unknown;
  reviewError?: unknown;
}) {
  const getSelfSubjectReview = vi.fn();
  if (opts.reviewError) {
    getSelfSubjectReview.mockRejectedValue(opts.reviewError);
  } else {
    getSelfSubjectReview.mockResolvedValue(opts.review);
  }

  mockFromToken.mockReturnValue({
    KubeConfig: opts.kubeConfig === undefined ? {} : opts.kubeConfig,
    kubeConfigInitError: opts.initError ?? null,
    getSelfSubjectReview,
  });

  return getSelfSubjectReview;
}

describe("authenticateServiceAccountToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates the token via SelfSubjectReview and maps the SA identity", async () => {
    stubClient({
      review: {
        status: {
          userInfo: {
            username: "system:serviceaccount:edp:edp-admin",
            uid: "u1",
            groups: ["system:authenticated"],
          },
        },
      },
    });

    const { data, secret } = await authenticateServiceAccountToken("sa-token");

    expect(mockFromToken).toHaveBeenCalledWith("sa-token");
    expect(data.sub).toBe("u1");
    expect(data.name).toBe("edp-admin");
    expect(data.default_namespace).toBe("edp");
    expect(secret.idToken).toBe("sa-token");
    expect(secret.accessToken).toBe("sa-token");
    expect(secret.refreshToken).toBe("");
  });

  it("throws INTERNAL_SERVER_ERROR when the K8s client cannot initialize", async () => {
    stubClient({ kubeConfig: null, initError: "No cluster configuration found in kubeconfig." });

    await expect(authenticateServiceAccountToken("t")).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("No cluster configuration"),
    });
  });

  it.each([401, 403])("maps HTTP %s to UNAUTHORIZED", async (status) => {
    stubClient({ reviewError: new K8sApiError(status, "x", "{}") });

    await expect(authenticateServiceAccountToken("t")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("maps HTTP 404 to INTERNAL_SERVER_ERROR (cluster lacks SelfSubjectReview)", async () => {
    stubClient({ reviewError: new K8sApiError(404, "Not Found", "{}") });

    await expect(authenticateServiceAccountToken("t")).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("SelfSubjectReview"),
    });
  });

  it("maps unexpected (non-K8sApiError) errors to INTERNAL_SERVER_ERROR", async () => {
    stubClient({ reviewError: new Error("network down") });

    await expect(authenticateServiceAccountToken("t")).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("throws when the cluster returns an empty identity", async () => {
    stubClient({ review: { status: { userInfo: {} } } });

    await expect(authenticateServiceAccountToken("t")).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: expect.stringContaining("empty identity"),
    });
  });
});
