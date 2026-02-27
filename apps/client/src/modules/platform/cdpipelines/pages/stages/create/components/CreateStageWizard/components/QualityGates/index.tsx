import React from "react";
import { useStore } from "@tanstack/react-form";
import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import { Alert } from "@/core/components/ui/alert";
import { Shield, Plus, Pencil, Trash2, CheckCircle, TestTube2, GitBranch, Workflow } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { stageQualityGateType } from "@my-project/shared";
import { useCDPipelineData } from "../../hooks/useDefaultValues";
import { useCreateStageForm } from "../../providers/form/hooks";
import { NAMES } from "../../names";
import { QualityGateInlineForm, type QualityGateFormValues } from "./QualityGateFormFields";

type QualityGate = {
  id: string;
} & QualityGateFormValues;

const defaultManualGate: QualityGateFormValues = {
  qualityGateType: stageQualityGateType.manual,
  stepName: "approve",
  autotestName: null,
  branchName: null,
};

export const QualityGates: React.FC = () => {
  const { namespace } = useCDPipelineData();
  const form = useCreateStageForm();

  const qualityGatesFieldValue = useStore(
    form.store,
    (state: typeof form.store.state) => state.values[NAMES.qualityGates] || []
  );

  // Get field errors for quality gates array-level validation
  // Use useStore to subscribe to field metadata changes for reactivity
  const qualityGatesFieldMeta = useStore(form.store, (state) => {
    return state.fieldMeta[NAMES.qualityGates];
  });

  const isTouched = qualityGatesFieldMeta?.isTouched;
  const errors = qualityGatesFieldMeta?.errors || [];
  const hasError = isTouched && errors.length > 0;

  const errorMessage =
    hasError && errors.length > 0
      ? typeof errors[0] === "string"
        ? errors[0]
        : (errors[0] as { message?: string })?.message
      : undefined;

  const [showGateForm, setShowGateForm] = React.useState(false);
  const [editingGateIndex, setEditingGateIndex] = React.useState<number | null>(null);

  const startAddingGate = () => {
    setEditingGateIndex(null);
    setShowGateForm(true);
  };

  const startEditingGate = (index: number) => {
    setEditingGateIndex(index);
    setShowGateForm(true);
  };

  const handleCancel = () => {
    setShowGateForm(false);
    setEditingGateIndex(null);
  };

  const handleSave = (values: QualityGateFormValues) => {
    if (editingGateIndex !== null) {
      // Update existing gate
      const updated = qualityGatesFieldValue.map((gate, idx) =>
        idx === editingGateIndex ? { ...gate, ...values } : gate
      );
      form.setFieldValue(NAMES.qualityGates, updated);
    } else {
      // Add new gate
      const newGate: QualityGate = { id: uuidv4(), ...values };
      form.setFieldValue(NAMES.qualityGates, [...qualityGatesFieldValue, newGate]);
    }
    setShowGateForm(false);
    setEditingGateIndex(null);
  };

  const handleDeleteGate = (index: number) => {
    form.setFieldValue(
      NAMES.qualityGates,
      qualityGatesFieldValue.filter((_, idx) => idx !== index)
    );
  };

  const editingGateValues: QualityGateFormValues | null =
    editingGateIndex !== null
      ? {
          qualityGateType: qualityGatesFieldValue[editingGateIndex]?.qualityGateType ?? "manual",
          stepName: qualityGatesFieldValue[editingGateIndex]?.stepName ?? "",
          autotestName: qualityGatesFieldValue[editingGateIndex]?.autotestName ?? null,
          branchName: qualityGatesFieldValue[editingGateIndex]?.branchName ?? null,
        }
      : null;

  const editingGateId = editingGateIndex !== null ? qualityGatesFieldValue[editingGateIndex]?.id : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-foreground mb-1 text-lg">Quality Gates</h3>
          <p className="text-muted-foreground text-sm">Configure quality gate validations for deployments</p>
        </div>
        {!showGateForm && (
          <Button onClick={startAddingGate} size="sm" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Quality Gate
          </Button>
        )}
      </div>

      {/* Inline Form (add/edit) */}
      {showGateForm && (
        <QualityGateInlineForm
          namespace={namespace}
          defaultValues={editingGateValues ?? defaultManualGate}
          onSave={handleSave}
          onCancel={handleCancel}
          isEditing={editingGateIndex !== null}
          existingQualityGates={qualityGatesFieldValue}
          editingGateId={editingGateId}
        />
      )}

      {/* Quality Gates List */}
      {qualityGatesFieldValue.length === 0 && !showGateForm ? (
        <Card className="border-border border-2 border-dashed p-12 text-center">
          <Shield className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h4 className="text-foreground mb-2">No Quality Gates Configured</h4>
          <p className="text-muted-foreground mb-4 text-sm">
            Add quality gates to validate deployments before they go live
          </p>
          <Button onClick={startAddingGate} variant="outline" type="button">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Quality Gate
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {qualityGatesFieldValue.map((gate, index) => (
            <Card key={gate.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 items-start gap-3">
                  <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
                    {gate.qualityGateType === "manual" ? (
                      <CheckCircle className="text-primary h-4 w-4" />
                    ) : (
                      <TestTube2 className="text-primary h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-foreground">Quality Gate #{index + 1}</span>
                      <Badge variant="outline" className="capitalize">
                        {gate.qualityGateType}
                      </Badge>
                    </div>
                    {gate.qualityGateType === "autotests" && (
                      <div className="text-muted-foreground space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <TestTube2 className="text-muted-foreground h-3 w-3" />
                          <span className="text-xs">Codebase:</span>
                          <span className="font-mono text-xs">{gate.autotestName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <GitBranch className="text-muted-foreground h-3 w-3" />
                          <span className="text-xs">Branch:</span>
                          <span className="font-mono text-xs">{gate.branchName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Workflow className="text-muted-foreground h-3 w-3" />
                          <span className="text-xs">Step:</span>
                          <span className="font-mono text-xs">{gate.stepName}</span>
                        </div>
                      </div>
                    )}
                    {gate.qualityGateType === "manual" && (
                      <div className="text-muted-foreground space-y-1 text-sm">
                        <p>Manual approval required before deployment</p>
                        <div className="flex items-center gap-2">
                          <Workflow className="text-muted-foreground h-3 w-3" />
                          <span className="text-xs">Step:</span>
                          <span className="font-mono text-xs">{gate.stepName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEditingGate(index)}
                    disabled={showGateForm}
                    type="button"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGate(index)}
                    disabled={showGateForm || qualityGatesFieldValue.length === 1}
                    type="button"
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {errorMessage && (
        <Alert variant="destructive" className="mt-2">
          {errorMessage}
        </Alert>
      )}
    </div>
  );
};
