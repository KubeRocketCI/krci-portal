import { useForm } from "react-hook-form";
import { ManageClusterSecretDataContext } from "../../../types";
import { FieldEvent, FORM_MODES } from "@/core/types/forms";
import { clusterType, ClusterType } from "@my-project/shared";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { useFormContext } from "@/core/providers/Form/hooks";
import { Boxes, Key } from "lucide-react";

interface ClusterTypeProps {
  onChange?: (event: FieldEvent<ClusterType>) => void;
  value?: string;
}

export const ClusterTypeField = ({ onChange, value }: ClusterTypeProps) => {
  const {
    control,
    formState: { errors },
    register,
  } = useForm();

  const {
    formData: { mode },
  } = useFormContext<ManageClusterSecretDataContext>();

  return (
    <FormRadioGroup
      {...register("clusterType", {
        required: `Select codebase language`,
        onChange: onChange,
      })}
      name="clusterType"
      control={control}
      errors={errors}
      options={[
        {
          label: "Bearer",
          value: clusterType.bearer,
          icon: <Boxes />,
          checkedIcon: <Boxes />,
        },
        {
          label: "IRSA",
          value: clusterType.irsa,
          icon: <Key />,
          checkedIcon: <Key />,
        },
      ]}
      label="Cluster Type"
      disabled={mode === FORM_MODES.EDIT}
      defaultValue={value}
    />
  );
};
