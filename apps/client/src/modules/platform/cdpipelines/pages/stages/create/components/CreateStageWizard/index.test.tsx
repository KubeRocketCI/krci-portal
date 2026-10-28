import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import type { Stage } from "@my-project/shared";
import type { CreateStageFormInstance } from "./providers/form/context";

const mocks = vi.hoisted(() => ({
  form: null as CreateStageFormInstance | null,
  otherStages: [] as Stage[],
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
    otherStages: mocks.otherStages,
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

const makeStage = (name: string, order: number, deletionTimestamp?: string): Stage =>
  ({ metadata: { name, deletionTimestamp }, spec: { order } }) as unknown as Stage;

const stagesAt = (...orders: number[]): Stage[] => orders.map((order, index) => makeStage(`s${index}`, order));

const terminatingStageAt = (order: number): Stage => makeStage("terminating", order, "2026-01-01T00:00:00Z");

const fillRequiredFields = (form: CreateStageFormInstance) => {
  act(() => {
    form.setFieldValue(NAMES.name, "s2");
    form.setFieldValue(NAMES.triggerTemplate, "deploy");
    form.setFieldValue(NAMES.cleanTemplate, "clean");
  });
};

const submittedOrder = (): number => {
  const [{ data }] = mocks.triggerCreateStage.mock.calls[0];
  return data.stage.spec.order;
};

describe("CreateStageWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each<[string, number, Stage[]]>([
    ["no other Stages", 0, []],
    ["other Stages at orders 0, 1, 2", 3, stagesAt(0, 1, 2)],
    ["other Stages at orders 0, 0, 0", 1, stagesAt(0, 0, 0)],
    ["other Stages at orders 0, 2", 3, stagesAt(0, 2)],
    ["other Stages at orders 0, 2, 1 in that list order", 3, stagesAt(0, 2, 1)],
    ["other Stages at orders 0, 1 and a terminating Stage at order 2", 2, [...stagesAt(0, 1), terminatingStageAt(2)]],
    ["only a terminating Stage at order 0", 0, [terminatingStageAt(0)]],
  ])("with %s the new Stage gets order %s", async (_, expected, stages) => {
    mocks.otherStages = stages;
    render(<CreateStageWizard />);
    const form = mocks.form!;
    fillRequiredFields(form);

    await act(() => form.handleSubmit());

    expect(submittedOrder()).toBe(expected);
  });

  it("uses the Stage list at submit when it changed after the form was touched", async () => {
    mocks.otherStages = stagesAt(0);
    const { rerender } = render(<CreateStageWizard />);
    const form = mocks.form!;
    fillRequiredFields(form);

    mocks.otherStages = stagesAt(0, 1);
    rerender(<CreateStageWizard />);
    await act(() => form.handleSubmit());

    expect(submittedOrder()).toBe(2);
  });
});
