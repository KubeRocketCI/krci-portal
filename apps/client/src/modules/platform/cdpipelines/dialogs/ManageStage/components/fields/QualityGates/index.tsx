import { Alert, Button, Divider, Tooltip, useTheme } from "@mui/material";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { useTypedFormContext } from "../../../hooks/useFormContext";
import { STAGE_FORM_NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";
import { Info, Plus, Trash } from "lucide-react";
import { QualityGateRow } from "./components/QualityGateRow";
import { defaultQualityGate } from "./constants";
import {
  createQualityGateAutotestFieldName,
  createQualityGateStepNameFieldName,
  createQualityGateTypeAutotestsBranchFieldName,
  createQualityGateTypeFieldName,
} from "./utils";

export const QualityGates = () => {
  const theme = useTheme();

  const { resetField, watch, setValue } = useTypedFormContext();

  const {
    props: { cdPipeline },
  } = useCurrentDialog();

  const namespace = cdPipeline?.metadata.namespace;

  const qualityGatesFieldValue = watch(STAGE_FORM_NAMES.qualityGates.name);

  const handleAddApplicationRow = React.useCallback(() => {
    setValue(STAGE_FORM_NAMES.qualityGates.name, [
      ...qualityGatesFieldValue,
      {
        ...defaultQualityGate,
        id: uuidv4(),
      },
    ]);
  }, [qualityGatesFieldValue, setValue]);

  const handleRemoveApplicationRow = React.useCallback(
    (id: string) => {
      setValue(
        STAGE_FORM_NAMES.qualityGates.name,
        qualityGatesFieldValue.filter((el) => {
          return el.id !== id;
        })
      );
      resetField(createQualityGateTypeFieldName(id));
      resetField(createQualityGateStepNameFieldName(id));
      resetField(createQualityGateAutotestFieldName(id));
      resetField(createQualityGateTypeAutotestsBranchFieldName(id));
    },
    [qualityGatesFieldValue, resetField, setValue]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-row flex-nowrap items-center gap-2">
        <h6 className="text-base font-medium">Quality gates</h6>
        <Tooltip title={"Define quality gates before promoting applications to the next environment."}>
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
                <div className="col-span-2">
                  <div className="flex flex-row items-center justify-end gap-2">
                    {!isOnly && (
                      <Button
                        type={"button"}
                        size={"small"}
                        component={"button"}
                        style={{ minWidth: 0 }}
                        onClick={() => handleRemoveApplicationRow(el.id)}
                      >
                        <Trash size={20} />
                      </Button>
                    )}
                    {!isOnly && isLast && (
                      <Divider orientation="vertical" sx={{ height: theme.typography.pxToRem(28) }} />
                    )}
                    {isLast && (
                      <Button
                        type={"button"}
                        size={"small"}
                        component={"button"}
                        style={{ minWidth: 0 }}
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
        <Alert severity="info" variant="outlined">
          Add at least one quality gate
        </Alert>
      )}
    </div>
  );
};
