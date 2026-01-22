import { Button } from "@/core/components/ui/button";
import { Alert } from "@/core/components/ui/alert";
import { Tooltip } from "@/core/components/ui/tooltip";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { useStore } from "@tanstack/react-form";
import { STAGE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { useStageForm } from "../../../providers/form/hooks";
import { Info, Plus, Trash } from "lucide-react";
import { QualityGateRow } from "./components/QualityGateRow";
import { defaultQualityGate } from "./constants";

export const QualityGates = () => {
  const form = useStageForm();

  const {
    props: { cdPipeline },
  } = useCurrentDialog();

  const namespace = cdPipeline?.metadata.namespace;

  // Subscribe to quality gates field value
  const qualityGatesFieldValue = useStore(
    form.store,
    (state) => state.values[STAGE_FORM_NAMES.qualityGates.name] || []
  );

  const handleAddApplicationRow = React.useCallback(() => {
    const currentGates = form.getFieldValue(STAGE_FORM_NAMES.qualityGates.name) || [];
    form.setFieldValue(STAGE_FORM_NAMES.qualityGates.name, [
      ...currentGates,
      {
        ...defaultQualityGate,
        id: uuidv4(),
      },
    ]);
  }, [form]);

  const handleRemoveApplicationRow = React.useCallback(
    (id: string) => {
      const currentGates = form.getFieldValue(STAGE_FORM_NAMES.qualityGates.name) || [];
      form.setFieldValue(
        STAGE_FORM_NAMES.qualityGates.name,
        currentGates.filter((el) => el.id !== id)
      );
    },
    [form]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-nowrap items-center gap-2">
        <h6 className="text-base font-medium">Quality gates</h6>
        <Tooltip title="Define quality gates before promoting applications to the next environment.">
          <Info size={16} />
        </Tooltip>
      </div>
      <div className="flex flex-col gap-4">
        {qualityGatesFieldValue.map((el, idx) => {
          const key = `quality-gate-row::${el.id}`;
          const isLast = idx === qualityGatesFieldValue.length - 1;
          const isOnly = qualityGatesFieldValue.length === 1;

          return (
            <div key={key}>
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-10">
                  <QualityGateRow namespace={namespace} currentQualityGate={el} />
                </div>
                <div className="col-span-2 mt-6">
                  <div className="flex flex-row items-center gap-2">
                    {!isOnly && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="min-w-0"
                        onClick={() => handleRemoveApplicationRow(el.id)}
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
                        onClick={handleAddApplicationRow}
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
    </div>
  );
};
