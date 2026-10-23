import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { CreateStageFormProvider } from "../providers/form/provider";
import { useCreateStageForm } from "../providers/form/hooks";
import { NAMES, type CreateStageFormValues } from "../names";
import { WIZARD_STEPS, useWizardStore } from "../store";
import { useCreateAnother } from "./useCreateAnother";

const FIRST_STEP_IDX = WIZARD_STEPS[0].id;
const SUCCESS_STEP_IDX = WIZARD_STEPS[WIZARD_STEPS.length - 1].id;

const defaultValues: CreateStageFormValues = {
  name: "",
  description: "",
  namespace: "default",
  cdPipeline: "pipeline",
  deployNamespace: "default-pipeline",
  cluster: "in-cluster",
  triggerType: "Manual",
  triggerTemplate: "deploy",
  cleanTemplate: "clean",
  sourceType: "default",
  sourceLibraryName: "default",
  sourceLibraryBranch: "default",
  qualityGates: [],
};

describe("useCreateAnother", () => {
  it("starts the next environment on the first step with empty fields", () => {
    const { result } = renderHook(() => ({ form: useCreateStageForm(), createAnother: useCreateAnother() }), {
      wrapper: ({ children }) => (
        <CreateStageFormProvider defaultValues={defaultValues} onSubmit={() => {}} onSubmitError={() => {}}>
          {children}
        </CreateStageFormProvider>
      ),
    });
    act(() => {
      result.current.form.setFieldValue(NAMES.name, "s1");
      useWizardStore.getState().setCurrentStepIdx(SUCCESS_STEP_IDX);
    });

    act(() => result.current.createAnother());

    expect(useWizardStore.getState().currentStepIdx).toBe(FIRST_STEP_IDX);
    expect(result.current.form.state.values).toEqual(defaultValues);
    expect(result.current.form.state.isTouched).toBe(false);
  });
});
