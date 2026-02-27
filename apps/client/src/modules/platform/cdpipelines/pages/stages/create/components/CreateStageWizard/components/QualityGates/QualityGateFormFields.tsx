import React from "react";
import { useStore } from "@tanstack/react-form";
import { z } from "zod";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Shield, X, Check, CheckCircle, TestTube2 } from "lucide-react";
import { stageQualityGateType, codebaseBranchLabels, codebaseLabels, codebaseType } from "@my-project/shared";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useAppForm } from "@/core/components/form";

export type QualityGateFormValues = {
  qualityGateType: "manual" | "autotests";
  stepName: string;
  autotestName: string | null;
  branchName: string | null;
};

interface QualityGateInlineFormProps {
  namespace: string;
  defaultValues: QualityGateFormValues;
  onSave: (values: QualityGateFormValues) => void;
  onCancel: () => void;
  isEditing: boolean;
  existingQualityGates: Array<{ id: string; stepName: string }>;
  editingGateId?: string | null;
}

export const QualityGateInlineForm: React.FC<QualityGateInlineFormProps> = ({
  namespace,
  defaultValues,
  onSave,
  onCancel,
  isEditing,
  existingQualityGates,
  editingGateId,
}) => {
  const form = useAppForm({
    defaultValues: defaultValues as QualityGateFormValues,
    onSubmit: async ({ value }) => {
      onSave(value);
    },
  });

  const qualityGateType = useStore(form.store, (state) => state.values.qualityGateType);
  const autotestName = useStore(form.store, (state) => state.values.autotestName);

  // Validator function to check for duplicate step names
  const validateStepNameUnique = React.useCallback(
    (stepName: string) => {
      if (!stepName || !stepName.trim()) {
        return undefined; // Let required validation handle empty values
      }

      const trimmedStepName = stepName.trim();

      // Check if this step name already exists in other quality gates
      const isDuplicate = existingQualityGates.some((gate) => {
        // Skip the gate we're currently editing
        if (isEditing && editingGateId && gate.id === editingGateId) {
          return false;
        }
        return gate.stepName.trim() === trimmedStepName;
      });

      if (isDuplicate) {
        return "This step name is already used by another quality gate";
      }

      return undefined;
    },
    [existingQualityGates, isEditing, editingGateId]
  );

  // Fetch autotests
  const codebasesWatch = useCodebaseWatchList({
    namespace,
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.autotest,
    },
    queryOptions: {
      enabled: !!namespace,
    },
  });

  const autotests = codebasesWatch.data.array;
  const autotestsOptions = React.useMemo(
    () =>
      autotests.map((autotest) => ({
        label: autotest.metadata.name,
        value: autotest.metadata.name,
      })),
    [autotests]
  );

  // Fetch branches for selected autotest
  const branchesWatch = useCodebaseBranchWatchList({
    namespace,
    labels: autotestName
      ? {
          [codebaseBranchLabels.codebase]: autotestName,
        }
      : {},
    queryOptions: {
      enabled: !!namespace && !!autotestName,
    },
  });

  const branchesOptions = React.useMemo(
    () =>
      branchesWatch.data.array.map((branch) => ({
        label: branch.spec.branchName,
        value: branch.spec.branchName,
      })),
    [branchesWatch.data.array]
  );

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-foreground flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            {isEditing ? "Edit Quality Gate" : "Add Quality Gate"}
          </h4>
        </div>

        {/* Quality Gate Type */}
        <form.AppField
          name="qualityGateType"
          listeners={{
            onChange: ({ value }) => {
              if (value === stageQualityGateType.manual) {
                form.setFieldValue("stepName", "approve");
                form.setFieldValue("autotestName", null);
                form.setFieldValue("branchName", null);
                // Clear validation errors from autotest fields to allow manual submission
                form.setFieldMeta("autotestName", (prev) => ({ ...prev, errors: [], errorMap: {} }));
                form.setFieldMeta("branchName", (prev) => ({ ...prev, errors: [], errorMap: {} }));
              } else {
                form.setFieldValue("stepName", "");
              }
            },
          }}
        >
          {(field) => (
            <field.FormRadioGroup
              label="Quality Gate Type"
              variant="horizontal"
              options={[
                {
                  value: stageQualityGateType.manual,
                  label: "Manual",
                  description: "Manual approval required",
                  icon: CheckCircle,
                },
                {
                  value: stageQualityGateType.autotests,
                  label: "Autotests",
                  description: "Automated test validation",
                  icon: TestTube2,
                },
              ]}
              classNames={{ item: "p-3", itemIcon: "h-4 w-4", itemIconContainer: "h-8 w-8", container: "grid-cols-2" }}
            />
          )}
        </form.AppField>

        {/* Autotest Configuration (conditional) */}
        {qualityGateType === "autotests" && (
          <div className="grid grid-cols-3 gap-4">
            <form.AppField
              name="autotestName"
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  // Only validate if current type is autotests
                  const currentType = fieldApi.form.getFieldValue("qualityGateType");
                  if (currentType !== stageQualityGateType.autotests) {
                    return undefined; // Skip validation
                  }

                  if (!value || value.trim().length === 0) {
                    return "Autotest codebase is required";
                  }
                  return undefined;
                },
              }}
              listeners={{
                onChange: () => {
                  form.setFieldValue("branchName", null);
                },
              }}
            >
              {(field) => (
                <field.FormSelect
                  label="Autotest Codebase"
                  placeholder="Select autotest codebase"
                  options={autotestsOptions}
                />
              )}
            </form.AppField>

            <form.AppField
              name="branchName"
              validators={{
                onSubmit: ({ value, fieldApi }) => {
                  // Only validate if current type is autotests
                  const currentType = fieldApi.form.getFieldValue("qualityGateType");
                  if (currentType !== stageQualityGateType.autotests) {
                    return undefined; // Skip validation
                  }

                  if (!value || value.trim().length === 0) {
                    return "Branch is required";
                  }
                  return undefined;
                },
              }}
            >
              {(field) => (
                <field.FormSelect
                  label="Branch"
                  placeholder="Select branch"
                  options={branchesOptions}
                  disabled={!autotestName || branchesWatch.query.isLoading}
                />
              )}
            </form.AppField>

            <form.AppField
              name="stepName"
              validators={{
                onChange: ({ value }: { value: string }) => {
                  // Check for required
                  if (!value || value.trim().length === 0) {
                    return "Step name is required";
                  }
                  // Check for duplicates
                  return validateStepNameUnique(value);
                },
                onSubmit: ({ value }: { value: string }) => {
                  // Only validate if current type is autotests
                  if (qualityGateType !== stageQualityGateType.autotests) {
                    return undefined;
                  }

                  const result = z.string().min(1, "Step name is required").safeParse(value);
                  if (!result.success) {
                    return "Step name is required";
                  }

                  // Also check for duplicates on submit
                  return validateStepNameUnique(value);
                },
              }}
            >
              {(field) => (
                <field.FormTextField
                  label="Step Name"
                  placeholder="e.g., run-tests"
                  tooltipText="Name of the pipeline step that runs the quality gate validation"
                />
              )}
            </form.AppField>
          </div>
        )}

        {/* Manual Step Name */}
        {qualityGateType === "manual" && (
          <form.AppField
            name="stepName"
            validators={{
              onChange: ({ value }: { value: string }) => {
                // Check for required
                if (!value || value.trim().length === 0) {
                  return "Step name is required";
                }
                // Check for duplicates
                return validateStepNameUnique(value);
              },
              onSubmit: ({ value }: { value: string }) => {
                // Only validate if current type is manual
                if (qualityGateType !== stageQualityGateType.manual) {
                  return undefined;
                }

                const result = z.string().min(1, "Step name is required").safeParse(value);
                if (!result.success) {
                  return "Step name is required";
                }

                // Also check for duplicates on submit
                return validateStepNameUnique(value);
              },
            }}
          >
            {(field) => <field.FormTextField label="Step Name" placeholder="e.g., approve" />}
          </form.AppField>
        )}

        {/* Form Actions */}
        <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            <Check className="mr-2 h-4 w-4" />
            {isEditing ? "Update" : "Add"} Quality Gate
          </Button>
        </div>
      </div>
    </Card>
  );
};
