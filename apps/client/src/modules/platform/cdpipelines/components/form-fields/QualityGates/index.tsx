import { Button } from "@/core/components/ui/button";
import { Card } from "@/core/components/ui/card";
import { Badge } from "@/core/components/ui/badge";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { useFormContext } from "react-hook-form";
import { NAMES, CreateStageFormValues } from "../../../pages/stages/create/components/CreateStageWizard/names";
import { Plus, Trash2, Shield, TestTube2, CheckCircle, GitBranch, Workflow, Edit } from "lucide-react";
import { QualityGateForm } from "./components/QualityGateForm";
import { defaultQualityGate } from "./constants";
import {
  createQualityGateAutotestFieldName,
  createQualityGateStepNameFieldName,
  createQualityGateTypeAutotestsBranchFieldName,
  createQualityGateTypeFieldName,
} from "./utils";
import { stageQualityGateType } from "@my-project/shared";
import { FormStageQualityGate } from "./types";

export interface QualityGatesFieldProps {
  namespace?: string;
}

export const QualityGatesField: React.FC<QualityGatesFieldProps> = ({ namespace }) => {
  const { resetField, watch, setValue } = useFormContext<CreateStageFormValues>();
  const [editingGateId, setEditingGateId] = React.useState<string | null>(null);
  const [showGateForm, setShowGateForm] = React.useState(false);

  const qualityGatesFieldValue = watch(NAMES.qualityGates);

  const handleAddGate = React.useCallback(() => {
    const newGate = {
      ...defaultQualityGate,
      id: uuidv4(),
    };
    setValue(NAMES.qualityGates, [...qualityGatesFieldValue, newGate]);
    setEditingGateId(newGate.id);
    setShowGateForm(true);
  }, [qualityGatesFieldValue, setValue]);

  const handleEditGate = React.useCallback((gateId: string) => {
    setEditingGateId(gateId);
    setShowGateForm(true);
  }, []);

  const handleDeleteGate = React.useCallback(
    (id: string) => {
      setValue(
        NAMES.qualityGates,
        qualityGatesFieldValue.filter((el) => el.id !== id)
      );
      resetField(createQualityGateTypeFieldName(id) as keyof CreateStageFormValues);
      resetField(createQualityGateStepNameFieldName(id) as keyof CreateStageFormValues);
      resetField(createQualityGateAutotestFieldName(id) as keyof CreateStageFormValues);
      resetField(createQualityGateTypeAutotestsBranchFieldName(id) as keyof CreateStageFormValues);

      if (editingGateId === id) {
        setShowGateForm(false);
        setEditingGateId(null);
      }
    },
    [qualityGatesFieldValue, resetField, setValue, editingGateId]
  );

  const handleSaveGate = React.useCallback(() => {
    setShowGateForm(false);
    setEditingGateId(null);
  }, []);

  const handleCancelGateForm = React.useCallback(() => {
    if (editingGateId) {
      const gate = qualityGatesFieldValue.find((g) => g.id === editingGateId);
      if (gate && !gate.qualityGateType) {
        setValue(
          NAMES.qualityGates,
          qualityGatesFieldValue.filter((el) => el.id !== editingGateId)
        );
      }
    }
    setShowGateForm(false);
    setEditingGateId(null);
  }, [editingGateId, qualityGatesFieldValue, setValue]);

  return (
    <div className="space-y-4">
      {/* Empty State */}
      {qualityGatesFieldValue.length === 0 && !showGateForm && (
        <Card className="border-border border-2 border-dashed p-12 text-center">
          <Shield className="text-muted-foreground mx-auto mb-3 h-12 w-12" />
          <h4 className="text-foreground mb-2">No Quality Gates Configured</h4>
          <p className="text-muted-foreground mb-4 text-sm">
            Add quality gates to validate deployments before they go live
          </p>
          <Button onClick={handleAddGate} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Quality Gate
          </Button>
        </Card>
      )}

      {/* Quality Gates List */}
      {qualityGatesFieldValue.length > 0 && (
        <div className="space-y-4">
          {/* Add Button at Top */}
          {!showGateForm && (
            <div className="flex justify-end">
              <Button onClick={handleAddGate} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Quality Gate
              </Button>
            </div>
          )}

          {qualityGatesFieldValue.map((gate, index) => {
            const isEditing = editingGateId === gate.id && showGateForm;

            if (isEditing) {
              return (
                <QualityGateForm
                  key={gate.id}
                  gate={gate}
                  namespace={namespace}
                  onSave={handleSaveGate}
                  onCancel={handleCancelGateForm}
                  isNew={!gate.qualityGateType}
                />
              );
            }

            return (
              <QualityGateCard
                key={gate.id}
                gate={gate}
                index={index}
                onEdit={() => handleEditGate(gate.id)}
                onDelete={() => handleDeleteGate(gate.id)}
                disabled={showGateForm}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

interface QualityGateCardProps {
  gate: FormStageQualityGate;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

const QualityGateCard: React.FC<QualityGateCardProps> = ({ gate, index, onEdit, onDelete, disabled }) => {
  const isManual = gate.qualityGateType === stageQualityGateType.manual;

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-1 items-start gap-3">
          <div className="bg-primary/10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full">
            {isManual ? (
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
            {!isManual && gate.autotestName && (
              <div className="text-muted-foreground space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <TestTube2 className="text-muted-foreground h-3 w-3" />
                  <span className="text-xs">Codebase:</span>
                  <span className="font-mono text-xs">{gate.autotestName}</span>
                </div>
                {gate.branchName && (
                  <div className="flex items-center gap-2">
                    <GitBranch className="text-muted-foreground h-3 w-3" />
                    <span className="text-xs">Branch:</span>
                    <span className="font-mono text-xs">{gate.branchName}</span>
                  </div>
                )}
                {gate.stepName && (
                  <div className="flex items-center gap-2">
                    <Workflow className="text-muted-foreground h-3 w-3" />
                    <span className="text-xs">Step:</span>
                    <span className="font-mono text-xs">{gate.stepName}</span>
                  </div>
                )}
              </div>
            )}
            {isManual && <p className="text-muted-foreground text-sm">Manual approval required before deployment</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} disabled={disabled}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} disabled={disabled}>
            <Trash2 className="text-destructive h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
