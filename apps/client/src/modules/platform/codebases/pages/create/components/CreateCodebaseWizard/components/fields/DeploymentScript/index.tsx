import React from "react";
import { codebaseDeploymentScript } from "@my-project/shared";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const DeploymentScript: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.deploymentScript}
      validators={{
        onChange: ({ value }) => (!value ? "Select the deployment script" : undefined),
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Deployment Options"
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
          options={Object.values(codebaseDeploymentScript).map((script) => ({
            label: script,
            value: script,
          }))}
        />
      )}
    </form.AppField>
  );
};
