import { useClusterSecretData } from "../../../providers/data/hooks";
import { FieldEvent, FORM_MODES } from "@/core/types/forms";
import { clusterType, ClusterType } from "@my-project/shared";
import { Boxes, Key } from "lucide-react";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";

interface ClusterTypeProps {
  onChange?: (event: FieldEvent<ClusterType>) => void;
  value?: ClusterType;
}

// ClusterTypeField is a controlled component (not connected to form state)
// It uses external state (value, onChange) since the cluster type determines
// which form variant to show (Bearer vs IRSA)
export const ClusterTypeField = ({ onChange, value }: ClusterTypeProps) => {
  const { mode } = useClusterSecretData();

  const options = React.useMemo(
    () => [
      {
        value: clusterType.bearer,
        label: "Bearer",
        icon: <Boxes className="h-4 w-4" />,
      },
      {
        value: clusterType.irsa,
        label: "IRSA",
        icon: <Key className="h-4 w-4" />,
      },
    ],
    []
  );

  const handleValueChange = React.useCallback(
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
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cluster Type</label>
      <Select value={value} onValueChange={handleValueChange} disabled={mode === FORM_MODES.EDIT}>
        <SelectTrigger>
          <SelectValue placeholder="Select cluster type" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
