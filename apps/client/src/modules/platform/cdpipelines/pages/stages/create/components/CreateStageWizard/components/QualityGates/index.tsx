import React from "react";
import { useCDPipelineData } from "../../hooks/useDefaultValues";
import { useCreateStageForm } from "../../providers/form/hooks";
import { NAMES } from "../../names";
import { Button } from "@/core/components/ui/button";
import { Alert } from "@/core/components/ui/alert";
import { Tooltip } from "@/core/components/ui/tooltip";
import { Info, Plus, Trash } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { stageQualityGateType, codebaseBranchLabels, codebaseLabels, codebaseType } from "@my-project/shared";
import { useStore } from "@tanstack/react-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { useCodebaseBranchWatchList } from "@/k8s/api/groups/KRCI/CodebaseBranch";

const defaultQualityGate = {
  id: uuidv4(),
  qualityGateType: stageQualityGateType.manual,
  stepName: "approve",
  autotestName: null,
  branchName: null,
};

type QualityGate = {
  id: string;
  qualityGateType: "manual" | "autotests";
  stepName: string;
  autotestName: string | null;
  branchName: string | null;
};

interface QualityGateRowProps {
  namespace: string;
  qualityGate: QualityGate;
  allQualityGates: QualityGate[];
  onUpdate: (id: string, updates: Partial<QualityGate>) => void;
  index: number;
}

const QualityGateRow: React.FC<QualityGateRowProps> = ({
  namespace,
  qualityGate,
  allQualityGates,
  onUpdate,
  index,
}) => {
  const form = useCreateStageForm();
  // Fetch autotests (codebases with type autotest)
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

  // Fetch branches for selected autotest
  const branchesWatch = useCodebaseBranchWatchList({
    namespace,
    labels: qualityGate.autotestName
      ? {
          [codebaseBranchLabels.codebase]: qualityGate.autotestName,
        }
      : {},
    queryOptions: {
      enabled: !!namespace && !!qualityGate.autotestName,
    },
  });

  const branches = React.useMemo(
    () => branchesWatch.data.array.map((branch) => branch.spec.branchName),
    [branchesWatch.data.array]
  );

  // Get already selected branches for the current autotest
  const alreadySelectedBranches = React.useMemo(() => {
    return allQualityGates
      .filter((qg) => qg.autotestName === qualityGate.autotestName && qg.id !== qualityGate.id)
      .map((qg) => qg.branchName)
      .filter(Boolean);
  }, [allQualityGates, qualityGate.autotestName, qualityGate.id]);

  const handleTypeChange = (value: string) => {
    onUpdate(qualityGate.id, {
      qualityGateType: value as "manual" | "autotests",
      stepName: value === stageQualityGateType.manual ? "approve" : "",
      autotestName: null,
      branchName: null,
    });
  };

  const handleStepNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(qualityGate.id, { stepName: e.target.value });
  };

  const handleAutotestChange = (value: string) => {
    onUpdate(qualityGate.id, {
      autotestName: value,
      branchName: null, // Reset branch when autotest changes
    });
  };

  const handleBranchChange = (value: string) => {
    onUpdate(qualityGate.id, { branchName: value });
  };

  const hasAutotests = autotests.length > 0;
  const isAutotestType = qualityGate.qualityGateType === stageQualityGateType.autotests;

  // Get field errors for stepName
  const stepNameFieldPath = `${NAMES.qualityGates}.${index}.stepName`;
  // Type assertion needed: fieldPath is constructed dynamically for nested array field
  // TanStack Form's getFieldMeta expects a statically-known field name
  const stepNameFieldMeta = form.getFieldMeta(stepNameFieldPath as never);
  const stepNameIsTouched = stepNameFieldMeta?.isTouched;
  const stepNameErrors = stepNameFieldMeta?.errors || [];
  const stepNameHasError = stepNameIsTouched && stepNameErrors.length > 0;

  // Extract error message - errors can be strings or objects with message property (from Zod)
  const stepNameErrorMessage = stepNameErrors[0]
    ? typeof stepNameErrors[0] === "string"
      ? stepNameErrors[0]
      : (stepNameErrors[0] as { message?: string })?.message
    : undefined;

  return (
    <div className="grid grid-cols-12 gap-2">
      <div className="col-span-3">
        <Label htmlFor={`quality-gate-type-${qualityGate.id}`}>Type</Label>
        <Select value={qualityGate.qualityGateType} onValueChange={handleTypeChange}>
          <SelectTrigger id={`quality-gate-type-${qualityGate.id}`}>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={stageQualityGateType.manual}>Manual</SelectItem>
            <SelectItem value={stageQualityGateType.autotests} disabled={!hasAutotests}>
              Autotests {!hasAutotests && "(No autotests available)"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="col-span-3">
        <Label htmlFor={`step-name-${qualityGate.id}`}>Step Name</Label>
        <Input
          id={`step-name-${qualityGate.id}`}
          value={qualityGate.stepName}
          onChange={handleStepNameChange}
          placeholder="Enter step name"
          className={stepNameHasError ? "border-destructive" : ""}
        />
        {stepNameHasError && <div className="text-destructive mt-1 text-sm">{stepNameErrorMessage}</div>}
      </div>

      {isAutotestType && (
        <>
          <div className="col-span-3">
            <Label htmlFor={`autotest-${qualityGate.id}`}>Autotest</Label>
            <Select
              value={qualityGate.autotestName || ""}
              onValueChange={handleAutotestChange}
              disabled={!hasAutotests}
            >
              <SelectTrigger id={`autotest-${qualityGate.id}`}>
                <SelectValue placeholder="Select autotest" />
              </SelectTrigger>
              <SelectContent>
                {autotests.map((autotest) => (
                  <SelectItem key={autotest.metadata.name} value={autotest.metadata.name}>
                    {autotest.metadata.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-3">
            <Label htmlFor={`branch-${qualityGate.id}`}>Branch</Label>
            <Select
              value={qualityGate.branchName || ""}
              onValueChange={handleBranchChange}
              disabled={!qualityGate.autotestName || branchesWatch.query.isLoading}
            >
              <SelectTrigger id={`branch-${qualityGate.id}`}>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => {
                  const isDisabled = alreadySelectedBranches.includes(branch);
                  return (
                    <SelectItem key={branch} value={branch} disabled={isDisabled}>
                      {branch} {isDisabled && "(already selected)"}
                    </SelectItem>
                  );
                })}
                {branches.length === 0 && !branchesWatch.query.isLoading && (
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">No branches available</div>
                )}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </div>
  );
};

export const QualityGates: React.FC = () => {
  const { namespace } = useCDPipelineData();
  const form = useCreateStageForm();

  // Subscribe to quality gates field value
  const qualityGatesFieldValue = useStore(
    form.store,
    (state: typeof form.store.state) => state.values[NAMES.qualityGates] || []
  );

  // Get field errors for quality gates
  const qualityGatesFieldMeta = form.getFieldMeta(NAMES.qualityGates);
  const isTouched = qualityGatesFieldMeta?.isTouched;
  const errors = qualityGatesFieldMeta?.errors || [];
  const hasError = isTouched && errors.length > 0;

  const handleAddQualityGate = React.useCallback(() => {
    const currentGates = form.getFieldValue(NAMES.qualityGates) || [];
    form.setFieldValue(NAMES.qualityGates, [
      ...currentGates,
      {
        ...defaultQualityGate,
        id: uuidv4(),
      },
    ]);
  }, [form]);

  const handleRemoveQualityGate = React.useCallback(
    (id: string) => {
      const currentGates = form.getFieldValue(NAMES.qualityGates) || [];
      form.setFieldValue(
        NAMES.qualityGates,
        currentGates.filter((el: (typeof currentGates)[0]) => el.id !== id)
      );
    },
    [form]
  );

  const handleUpdateQualityGate = React.useCallback(
    (id: string, updates: Partial<(typeof qualityGatesFieldValue)[0]>) => {
      const currentGates = form.getFieldValue(NAMES.qualityGates) || [];
      form.setFieldValue(
        NAMES.qualityGates,
        currentGates.map((gate: (typeof currentGates)[0]) => (gate.id === id ? { ...gate, ...updates } : gate))
      );
    },
    [form]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Quality Gates</h2>
        <p className="text-muted-foreground text-sm">
          Define quality gates that must pass before applications can be promoted to the next environment. You can
          configure manual approvals or automated tests.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-row flex-nowrap items-center gap-2">
          <h6 className="text-base font-medium">Quality gates</h6>
          <Tooltip title="Define quality gates before promoting applications to the next environment.">
            <Info size={16} />
          </Tooltip>
        </div>

        <div className="flex flex-col gap-4">
          {qualityGatesFieldValue.map((qualityGate: (typeof qualityGatesFieldValue)[0], idx: number) => {
            const key = `quality-gate-row::${qualityGate.id}`;
            const isLast = idx === qualityGatesFieldValue.length - 1;
            const isOnly = qualityGatesFieldValue.length === 1;

            return (
              <div key={key}>
                <div className="grid grid-cols-12 items-center gap-2">
                  <div className="col-span-10">
                    <QualityGateRow
                      namespace={namespace}
                      qualityGate={qualityGate}
                      allQualityGates={qualityGatesFieldValue}
                      onUpdate={handleUpdateQualityGate}
                      index={idx}
                    />
                  </div>
                  <div className="col-span-2 mt-6">
                    <div className="flex flex-row items-center gap-2">
                      {!isOnly && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="min-w-0"
                          onClick={() => handleRemoveQualityGate(qualityGate.id)}
                        >
                          <Trash size={20} />
                        </Button>
                      )}
                      {!isOnly && isLast && <div className="bg-border h-7 w-px" />}
                      {isLast && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="min-w-0"
                          onClick={handleAddQualityGate}
                        >
                          <Plus size={20} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {(!qualityGatesFieldValue || !qualityGatesFieldValue.length) && (
          <Alert variant="default">Add at least one quality gate</Alert>
        )}

        {hasError && errors.length > 0 && (
          <div className="text-destructive text-sm">
            {errors.map((error, errorIndex) => {
              // Extract error message - errors can be strings or objects with message property (from Zod)
              const errorMessage = typeof error === "string" ? error : (error as { message?: string })?.message;
              return <div key={errorIndex}>{errorMessage}</div>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};
