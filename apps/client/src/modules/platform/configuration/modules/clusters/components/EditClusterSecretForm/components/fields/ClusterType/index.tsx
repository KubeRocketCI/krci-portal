import { useClusterSecretData } from "../../../providers/data/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { clusterType, ClusterType } from "@my-project/shared";
import { Boxes, Key } from "lucide-react";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";

interface ClusterTypeProps {
  onChange: (value: ClusterType) => void;
  value: ClusterType;
}

// Controlled by value and onChange; registers no form field itself.
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

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Cluster Type</label>
      <Select
        value={value}
        onValueChange={(newValue) => onChange(newValue as ClusterType)}
        disabled={mode === FORM_MODES.EDIT}
      >
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
