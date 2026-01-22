import { useClusterSecretData } from "../../../providers/data/hooks";
import { FieldEvent, FORM_MODES } from "@/core/types/forms";
import { clusterType, ClusterType } from "@my-project/shared";
import type { FormRadioOption } from "@/core/form-temp";
import { Boxes, Key } from "lucide-react";
import React from "react";

interface ClusterTypeProps {
  onChange?: (event: FieldEvent<ClusterType>) => void;
  value?: ClusterType;
}

// ClusterTypeField is a controlled component (not connected to form state)
// It uses external state (value, onChange) since the cluster type determines
// which form variant to show (Bearer vs IRSA)
export const ClusterTypeField = ({ onChange, value }: ClusterTypeProps) => {
  const { mode } = useClusterSecretData();

  const options: FormRadioOption[] = React.useMemo(
    () => [
      {
        value: clusterType.bearer,
        label: "Bearer",
        icon: <Boxes />,
        checkedIcon: <Boxes />,
      },
      {
        value: clusterType.irsa,
        label: "IRSA",
        icon: <Key />,
        checkedIcon: <Key />,
      },
    ],
    []
  );

  const handleChange = React.useCallback(
    (newValue: string) => {
      if (onChange) {
        onChange({
          target: {
            value: newValue as ClusterType,
            name: "clusterType",
          },
        } as FieldEvent<ClusterType>);
      }
    },
    [onChange]
  );

  // This component is controlled externally, not part of the TanStack form
  // Using a simple radio group instead of form-connected one
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cluster Type</label>
      <div className="flex gap-4">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
            disabled={mode === FORM_MODES.EDIT}
            className={`flex items-center gap-2 rounded-md border px-4 py-2 transition-colors ${
              value === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            } ${mode === FORM_MODES.EDIT ? "cursor-not-allowed opacity-50" : ""}`}
          >
            {typeof option.icon === "function" ? <option.icon /> : (option.icon as React.ReactNode)}
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
