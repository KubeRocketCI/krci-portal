import React from "react";
import { FormSelect } from "@/core/providers/Form/components/FormSelect";
import { codebaseDeploymentScript } from "@my-project/shared";
import { useFormContext } from "react-hook-form";
import { NAMES } from "../../../pages/create/components/CreateCodebaseWizard/names";

export const DeploymentScriptField: React.FC = () => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  const options = Object.values(codebaseDeploymentScript).map((script) => ({
    label: script,
    value: script,
  }));

  return (
    <FormSelect
      {...register(NAMES.deploymentScript)}
      label={"Deployment Options"}
      tooltipText={
        <>
          Select the deployment approach that best suits your target environment:
          <ul>
            <li>
              <strong>Helm</strong>: Deploy applications within Kubernetes clusters.
            </li>
            <li>
              <strong>RPM</strong>: Install applications on RPM-based Linux distributions.
            </li>
          </ul>
        </>
      }
      control={control}
      errors={errors}
      options={options}
    />
  );
};

