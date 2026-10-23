import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import type { CreateStageFormInstance } from "./providers/form/context";

const mocks = vi.hoisted(() => ({
  form: null as CreateStageFormInstance | null,
  stageCount: 0,
  triggerCreateStage: vi.fn(),
}));

vi.mock("@/k8s/api/groups/KRCI/Stage", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/k8s/api/groups/KRCI/Stage")>()),
  useStageCRUD: () => ({
    triggerCreateStage: mocks.triggerCreateStage,
    mutations: { stageCreateMutation: { isPending: false } },
  }),
}));

vi.mock("./hooks/useDefaultValues", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./hooks/useDefaultValues")>()),
  useCDPipelineData: () => ({
    cdPipelineIsLoading: false,
    cdPipelineError: null,
    otherStages: Array.from({ length: mocks.stageCount }),
    otherStagesIsLoading: false,
    triggerTemplatesIsLoading: false,
    triggerTemplateList: [],
  }),
}));

vi.mock("./hooks/useSafeStageCreateParams", () => ({
  useSafeStageCreateParams: () => ({ namespace: "default", cdPipeline: "pipeline" }),
}));

vi.mock("./components/WizardNavigation", () => ({ WizardNavigation: () => null }));

vi.mock("./components/BasicConfiguration", async () => {
  const { useCreateStageForm } = await import("./providers/form/hooks");

  return {
    BasicConfiguration: function BasicConfiguration() {
      mocks.form = useCreateStageForm();
      return null;
    },
  };
});

import { CreateStageWizard } from "./index";
import { NAMES } from "./names";

describe("CreateStageWizard", () => {
  it("creates the Stage with the Stage count at submit as its order", async () => {
    mocks.stageCount = 1;
    const { rerender } = render(<CreateStageWizard />);
    const form = mocks.form!;
    act(() => {
      form.setFieldValue(NAMES.name, "s2");
      form.setFieldValue(NAMES.triggerTemplate, "deploy");
      form.setFieldValue(NAMES.cleanTemplate, "clean");
    });

    mocks.stageCount = 2;
    rerender(<CreateStageWizard />);
    await act(() => form.handleSubmit());

    const [{ data }] = mocks.triggerCreateStage.mock.calls[0];
    expect(data.stage.spec.order).toBe(2);
  });
});
