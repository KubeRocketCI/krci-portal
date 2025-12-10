import React from "react";
import { useFormContext } from "react-hook-form";
import { NAMES, CreateStageFormValues } from "../../../../../pages/stages/create/components/CreateStageWizard/names";
import { FormStageQualityGate } from "../../types";
import {
  StageQualityGateType,
  stageQualityGateType,
  codebaseBranchLabels,
  codebaseLabels,
  codebaseType,
} from "@my-project/shared";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Label } from "@/core/components/ui/label";
import { Input } from "@/core/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/core/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Shield, CheckCircle, TestTube2, GitBranch, Workflow, Info, X, Check } from "lucide-react";

interface QualityGateFormProps {
  gate: FormStageQualityGate;
  namespace?: string;
  onSave: () => void;
  onCancel: () => void;
  isNew?: boolean;
}

export const QualityGateForm: React.FC<QualityGateFormProps> = ({ gate, namespace, onSave, onCancel, isNew }) => {
  const { watch, setValue } = useFormContext<CreateStageFormValues>();
  const qualityGatesFieldValue = watch(NAMES.qualityGates);

  const [localType, setLocalType] = React.useState<StageQualityGateType>(
    gate.qualityGateType || stageQualityGateType.manual
  );
  const [localAutotestCodebase, setLocalAutotestCodebase] = React.useState(gate.autotestName || "");
  const [localAutotestBranch, setLocalAutotestBranch] = React.useState(gate.branchName || "");
  const [localStepName, setLocalStepName] = React.useState(gate.stepName || "");

  const autotestsWatch = useCodebaseWatchList({
    namespace,
    labels: {
      [codebaseLabels.codebaseType]: codebaseType.autotest,
    },
  });

  const branchesWatch = useCodebaseBranchWatchList({
    namespace,
    labels: {
      [codebaseBranchLabels.codebase]: localAutotestCodebase,
    },
    queryOptions: {
      enabled: !!localAutotestCodebase && !!namespace,
    },
  });

  const autotests = autotestsWatch.data.array;
  const branches = React.useMemo(
    () => branchesWatch.data.array.map((branch) => branch.spec.branchName),
    [branchesWatch.data.array]
  );

  const canSave = React.useMemo(() => {
    if (localType === stageQualityGateType.manual) {
      return true;
    }
    return localAutotestCodebase && localAutotestBranch && localStepName;
  }, [localType, localAutotestCodebase, localAutotestBranch, localStepName]);

  const handleSave = React.useCallback(() => {
    const updatedGates = qualityGatesFieldValue.map((g) => {
      if (g.id !== gate.id) return g;

      return {
        ...g,
        qualityGateType: localType,
        autotestName: localType === stageQualityGateType.autotests ? localAutotestCodebase : null,
        branchName: localType === stageQualityGateType.autotests ? localAutotestBranch : null,
        stepName: localType === stageQualityGateType.autotests ? localStepName : "approve",
      };
    });

    setValue(NAMES.qualityGates, updatedGates);
    onSave();
  }, [
    gate.id,
    localType,
    localAutotestCodebase,
    localAutotestBranch,
    localStepName,
    qualityGatesFieldValue,
    setValue,
    onSave,
  ]);

  const handleTypeChange = (value: string) => {
    setLocalType(value as StageQualityGateType);
    if (value === stageQualityGateType.manual) {
      setLocalAutotestCodebase("");
      setLocalAutotestBranch("");
      setLocalStepName("");
    }
  };

  const handleAutotestCodebaseChange = (value: string) => {
    setLocalAutotestCodebase(value);
    setLocalAutotestBranch("");
  };

  return (
    <Card className="border-primary/30 bg-primary/5 border-2 p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-foreground flex items-center gap-2">
            <Shield className="text-primary h-5 w-5" />
            {isNew ? "Add Quality Gate" : "Edit Quality Gate"}
          </h4>
        </div>

        {/* Quality Gate Type */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Shield className="text-muted-foreground h-4 w-4" />
            Quality Gate Type
            <span className="text-destructive">*</span>
          </Label>
          <RadioGroup value={localType} onValueChange={handleTypeChange}>
            <div className="grid grid-cols-2 gap-4">
              <div
                className={`relative flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition-all ${
                  localType === stageQualityGateType.manual
                    ? "border-primary bg-primary/10"
                    : "bg-background border-border hover:border-muted-foreground/30"
                }`}
              >
                <RadioGroupItem value={stageQualityGateType.manual} id="qg-manual" className="mt-0.5" />
                <Label htmlFor="qg-manual" className="flex-1 cursor-pointer">
                  <div className="mb-1 flex items-center gap-2">
                    <CheckCircle className="text-muted-foreground h-4 w-4" />
                    <span className="text-sm">Manual</span>
                  </div>
                  <p className="text-muted-foreground text-xs">Manual approval required</p>
                </Label>
              </div>
              <div
                className={`relative flex cursor-pointer items-start space-x-3 rounded-lg border-2 p-4 transition-all ${
                  localType === stageQualityGateType.autotests
                    ? "border-primary bg-primary/10"
                    : "bg-background border-border hover:border-muted-foreground/30"
                } ${!autotests.length ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <RadioGroupItem
                  value={stageQualityGateType.autotests}
                  id="qg-autotests"
                  className="mt-0.5"
                  disabled={!autotests.length}
                />
                <Label
                  htmlFor="qg-autotests"
                  className={`flex-1 ${autotests.length ? "cursor-pointer" : "cursor-not-allowed"}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <TestTube2 className="text-primary h-4 w-4" />
                    <span className="text-sm">Autotests</span>
                  </div>
                  <p className="text-muted-foreground text-xs">Automated test validation</p>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Autotest Configuration */}
        {localType === stageQualityGateType.autotests && (
          <div className="bg-background space-y-4 rounded-lg border p-4">
            <div className="flex items-start gap-2">
              <Info className="text-primary mt-0.5 h-4 w-4" />
              <p className="text-primary text-sm">Configure automated tests that must pass before deployment</p>
            </div>

            {/* Autotest Codebase Select */}
            <div className="space-y-2">
              <Label htmlFor="autotestCodebase" className="flex items-center gap-2">
                <TestTube2 className="text-muted-foreground h-4 w-4" />
                Autotest Codebase
                <span className="text-destructive">*</span>
              </Label>
              <Select value={localAutotestCodebase} onValueChange={handleAutotestCodebaseChange}>
                <SelectTrigger id="autotestCodebase">
                  <SelectValue placeholder="Select autotest codebase" />
                </SelectTrigger>
                <SelectContent>
                  {autotests.map((codebase) => (
                    <SelectItem key={codebase.metadata.name} value={codebase.metadata.name}>
                      <div className="flex items-center gap-2">
                        <TestTube2 className="text-muted-foreground h-4 w-4" />
                        <span>{codebase.metadata.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Autotest Branch */}
            <div className="space-y-2">
              <Label htmlFor="autotestBranch" className="flex items-center gap-2">
                <GitBranch className="text-muted-foreground h-4 w-4" />
                Autotest Branch
                <span className="text-destructive">*</span>
              </Label>
              <Select
                value={localAutotestBranch}
                onValueChange={setLocalAutotestBranch}
                disabled={!localAutotestCodebase}
              >
                <SelectTrigger id="autotestBranch">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      <div className="flex items-center gap-2">
                        <GitBranch className="text-muted-foreground h-4 w-4" />
                        <span className="font-mono text-sm">{branch}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quality Gate Step Name */}
            <div className="space-y-2">
              <Label htmlFor="qualityGateStepName" className="flex items-center gap-2">
                <Workflow className="text-muted-foreground h-4 w-4" />
                Quality Gate Step Name
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="qualityGateStepName"
                placeholder="e.g., run-integration-tests"
                value={localStepName}
                onChange={(e) => setLocalStepName(e.target.value)}
              />
              <p className="text-muted-foreground text-xs">
                Name of the pipeline step that runs the quality gate validation
              </p>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="border-border flex items-center justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            <Check className="mr-2 h-4 w-4" />
            {isNew ? "Add" : "Update"} Quality Gate
          </Button>
        </div>
      </div>
    </Card>
  );
};
