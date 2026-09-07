import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { k8sConfigMapConfig, k8sSecretConfig } from "@my-project/shared";
import { K8sClient } from "../../../../../../clients/k8s/index.js";
import { createMockedContext } from "../../../../../../__mocks__/context.js";
import { t } from "../../../../../../trpc.js";
import { createManageIntegrationProcedure, currentResourceSchema } from "./index.js";

vi.mock("../../../../../../clients/k8s/index.js", () => ({
  K8sClient: vi.fn(),
}));

const configA = k8sConfigMapConfig;
const configB = k8sSecretConfig;

const resource = (name: string) => ({
  apiVersion: "v1",
  kind: "Secret",
  metadata: { name, namespace: "test-namespace", uid: "", creationTimestamp: "" },
});

const inputSchema = z.object({
  namespace: z.string(),
  mode: z.enum(["create", "edit"]),
  dirtyFields: z.object({
    byMode: z.boolean(),
    byResource: z.boolean(),
    editOnly: z.boolean(),
    provisioned: z.boolean(),
  }),
  byMode: z.object({ value: z.string(), currentResource: currentResourceSchema }),
  byResource: z.object({ value: z.string(), currentResource: currentResourceSchema }),
  editOnly: z.object({ value: z.string(), currentResource: currentResourceSchema }).optional(),
  provisioned: z.object({ value: z.string(), currentResource: currentResourceSchema }).optional(),
});

type TestInput = z.infer<typeof inputSchema>;

const createDraft = vi.fn((slice: { value: string }) => resource(`draft-${slice.value}`));
const editResource = vi.fn((current: ReturnType<typeof resource>, slice: { value: string }) => ({
  ...current,
  edited: slice.value,
}));

const procedure = createManageIntegrationProcedure({
  inputSchema,
  label: "test integration",
  steps: [
    {
      key: "byMode",
      resourceConfig: configA,
      createDraft,
      edit: editResource,
    },
    {
      key: "byResource",
      resourceConfig: configB,
      branchOn: "currentResource",
      createDraft,
      edit: editResource,
    },
    {
      key: "editOnly",
      resourceConfig: configA,
      edit: editResource,
    },
    {
      key: "provisioned",
      resourceConfig: configB,
      skipInCreateMode: true,
      edit: editResource,
    },
  ],
});

const caller = t.createCallerFactory(t.router({ manageTest: procedure }));

const baseInput = {
  namespace: "test-namespace",
  mode: "edit" as const,
  dirtyFields: { byMode: false, byResource: false, editOnly: false, provisioned: false },
  byMode: { value: "a" },
  byResource: { value: "b" },
};

describe("createManageIntegrationProcedure", () => {
  let mockContext: ReturnType<typeof createMockedContext>;
  let k8s: { KubeConfig: object; createResource: Mock; replaceResource: Mock };

  beforeEach(() => {
    mockContext = createMockedContext();
    k8s = { KubeConfig: {}, createResource: vi.fn(), replaceResource: vi.fn() };
    (K8sClient as unknown as Mock).mockImplementation(function () {
      return k8s;
    });
  });

  afterEach(() => vi.clearAllMocks());

  const call = (input: unknown) => caller(mockContext).manageTest(input as TestInput);

  const rejection = async (input: unknown) => {
    let caught: unknown;
    await call(input).catch((error) => {
      caught = error;
    });
    expect(caught, "expected the call to reject").toBeInstanceOf(TRPCError);
    return caught as TRPCError;
  };

  describe("step gating", () => {
    it("writes nothing when no field is dirty", async () => {
      const result = await call(baseInput);

      expect(result.success).toBe(true);
      expect(k8s.createResource).not.toHaveBeenCalled();
      expect(k8s.replaceResource).not.toHaveBeenCalled();
    });

    it("returns a key for every step, undefined when the step did not run", async () => {
      const result = await call(baseInput);

      expect(result.data).toStrictEqual({
        byMode: undefined,
        byResource: undefined,
        editOnly: undefined,
        provisioned: undefined,
        message: "Successfully updated test integration",
      });
    });

    it("skips a dirty step whose input slice is absent", async () => {
      await call({ ...baseInput, dirtyFields: { ...baseInput.dirtyFields, editOnly: true } });

      expect(k8s.replaceResource).not.toHaveBeenCalled();
    });

    it("runs steps in declaration order", async () => {
      k8s.replaceResource.mockResolvedValue(resource("written"));

      await call({
        ...baseInput,
        dirtyFields: { byMode: true, byResource: true, editOnly: true, provisioned: true },
        byMode: { value: "a", currentResource: resource("a") },
        byResource: { value: "b", currentResource: resource("b") },
        editOnly: { value: "c", currentResource: resource("c") },
        provisioned: { value: "d", currentResource: resource("d") },
      });

      expect(k8s.replaceResource.mock.calls.map((args) => args[1])).toEqual(["a", "b", "c", "d"]);
    });
  });

  describe("create vs edit", () => {
    it("defaults to branching on mode, creating in create mode", async () => {
      k8s.createResource.mockResolvedValueOnce(resource("created"));

      const result = await call({
        ...baseInput,
        mode: "create",
        dirtyFields: { ...baseInput.dirtyFields, byMode: true },
      });

      expect(createDraft).toHaveBeenCalledWith({ value: "a" }, expect.objectContaining({ mode: "create" }));
      expect(k8s.createResource).toHaveBeenCalledWith(configA, "test-namespace", resource("draft-a"));
      expect(result.data.byMode).toEqual(resource("created"));
    });

    it("defaults to branching on mode, replacing by the edited resource name", async () => {
      k8s.replaceResource.mockResolvedValueOnce(resource("replaced"));

      const result = await call({
        ...baseInput,
        dirtyFields: { ...baseInput.dirtyFields, byMode: true },
        byMode: { value: "a", currentResource: resource("live") },
      });

      expect(editResource).toHaveBeenCalledWith(
        resource("live"),
        { value: "a", currentResource: resource("live") },
        expect.anything()
      );
      expect(k8s.replaceResource).toHaveBeenCalledWith(configA, "live", "test-namespace", {
        ...resource("live"),
        edited: "a",
      });
      expect(result.data.byMode).toEqual(resource("replaced"));
    });

    it("branchOn currentResource creates in edit mode when there is no live resource", async () => {
      k8s.createResource.mockResolvedValueOnce(resource("created"));

      await call({ ...baseInput, dirtyFields: { ...baseInput.dirtyFields, byResource: true } });

      expect(k8s.createResource).toHaveBeenCalledWith(configB, "test-namespace", resource("draft-b"));
    });

    it("branchOn currentResource edits in create mode when the resource already exists", async () => {
      k8s.replaceResource.mockResolvedValueOnce(resource("replaced"));

      await call({
        ...baseInput,
        mode: "create",
        dirtyFields: { ...baseInput.dirtyFields, byResource: true },
        byResource: { value: "b", currentResource: resource("live") },
      });

      expect(k8s.replaceResource).toHaveBeenCalledWith(configB, "live", "test-namespace", expect.anything());
    });

    it("edits a step with no createDraft even in create mode", async () => {
      k8s.replaceResource.mockResolvedValueOnce(resource("replaced"));

      await call({
        ...baseInput,
        mode: "create",
        dirtyFields: { ...baseInput.dirtyFields, editOnly: true },
        editOnly: { value: "c", currentResource: resource("live") },
      });

      expect(k8s.replaceResource).toHaveBeenCalledTimes(1);
    });

    it("skips a skipInCreateMode step in create mode", async () => {
      await call({
        ...baseInput,
        mode: "create",
        dirtyFields: { ...baseInput.dirtyFields, provisioned: true },
        provisioned: { value: "d", currentResource: resource("live") },
      });

      expect(k8s.replaceResource).not.toHaveBeenCalled();
    });
  });

  describe("validation", () => {
    it("names the step in the missing currentResource error", async () => {
      await expect(call({ ...baseInput, dirtyFields: { ...baseInput.dirtyFields, byMode: true } })).rejects.toThrow(
        "currentResource is required to edit byMode"
      );
    });

    it("names the step when an edit-only step reaches the edit path in create mode", async () => {
      await expect(
        call({
          ...baseInput,
          mode: "create",
          dirtyFields: { ...baseInput.dirtyFields, editOnly: true },
          editOnly: { value: "c" },
        })
      ).rejects.toThrow("currentResource is required to edit editOnly");
    });

    it("reports a missing currentResource as a client error", async () => {
      const error = await rejection({
        ...baseInput,
        dirtyFields: { ...baseInput.dirtyFields, byMode: true },
      });

      expect(error.code).toBe("BAD_REQUEST");
      expect(editResource).not.toHaveBeenCalled();
    });

    it.each([
      ["an empty object", {}],
      ["metadata without a name", { metadata: {} }],
      ["null", null],
      ["false", false],
      ["an empty string", ""],
      ["zero", 0],
    ])("rejects %s at the input boundary", async (_label, malformed) => {
      const error = await rejection({
        ...baseInput,
        dirtyFields: { ...baseInput.dirtyFields, byResource: true },
        byResource: { value: "b", currentResource: malformed },
      });

      expect(error.code).toBe("BAD_REQUEST");
      expect(createDraft).not.toHaveBeenCalled();
      expect(editResource).not.toHaveBeenCalled();
      expect(k8s.createResource).not.toHaveBeenCalled();
      expect(k8s.replaceResource).not.toHaveBeenCalled();
    });

    it("names an editOnly step in the missing currentResource error", async () => {
      await expect(
        call({
          ...baseInput,
          dirtyFields: { ...baseInput.dirtyFields, editOnly: true },
          editOnly: { value: "c" },
        })
      ).rejects.toThrow("currentResource is required to edit editOnly");
    });
  });

  describe("fail-fast", () => {
    it("stops after the first failure and keeps earlier writes", async () => {
      k8s.replaceResource.mockResolvedValueOnce(resource("first")).mockRejectedValueOnce(new Error("boom"));

      await expect(
        call({
          ...baseInput,
          dirtyFields: { byMode: true, byResource: true, editOnly: true, provisioned: false },
          byMode: { value: "a", currentResource: resource("a") },
          byResource: { value: "b", currentResource: resource("b") },
          editOnly: { value: "c", currentResource: resource("c") },
        })
      ).rejects.toThrow("boom");

      expect(k8s.replaceResource).toHaveBeenCalledTimes(2);
    });

    it("logs the failure under the capitalized label", async () => {
      const logged = vi.spyOn(console, "error").mockImplementation(() => {});
      k8s.createResource.mockRejectedValueOnce(new Error("boom"));

      await expect(
        call({ ...baseInput, mode: "create", dirtyFields: { ...baseInput.dirtyFields, byMode: true } })
      ).rejects.toThrow("boom");

      expect(logged).toHaveBeenCalledWith("Test integration operation failed:", expect.any(Error));
      logged.mockRestore();
    });
  });

  describe("message", () => {
    it("reads created in create mode", async () => {
      const result = await call({ ...baseInput, mode: "create" });

      expect(result.data.message).toBe("Successfully created test integration");
    });
  });

  describe("session", () => {
    it("rejects when the K8s client has no KubeConfig", async () => {
      (K8sClient as unknown as Mock).mockImplementation(function () {
        return { KubeConfig: null };
      });

      await expect(call(baseInput)).rejects.toThrow();
    });
  });
});
