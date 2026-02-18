import React from "react";
import { ciTemplateLabels, gitlabCiDefaultTemplate } from "@my-project/shared";
import { useConfigMapWatchList } from "@/k8s/api/groups/Core/ConfigMap/hooks";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

const CI_TEMPLATE_LABEL_SELECTOR = {
  [ciTemplateLabels.ciTemplate]: "gitlab",
} as const;

export const GitlabCiTemplate: React.FC = () => {
  const form = useCreateCodebaseForm();

  const configMapListWatch = useConfigMapWatchList({
    labels: CI_TEMPLATE_LABEL_SELECTOR,
  });

  const options = React.useMemo(() => {
    return (configMapListWatch.data?.array ?? []).map((cm) => {
      const isDefault = cm.metadata.name === gitlabCiDefaultTemplate;
      const name = cm.metadata.name;
      const description = cm.data?.description?.trim();

      return {
        label: (
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-sm font-medium">{name}</span>
            {isDefault && <span className="text-muted-foreground shrink-0 text-xs">(Default)</span>}
            {description && <span className="text-muted-foreground truncate text-xs">{description}</span>}
          </span>
        ),
        value: name,
      };
    });
  }, [configMapListWatch.data?.array]);

  return (
    <form.AppField name={NAMES.ui_gitlabCiTemplate}>
      {(field) => (
        <field.FormCombobox
          label="GitLab CI Template"
          tooltipText="CI/CD pipeline template for this project."
          options={options}
          disabled={!configMapListWatch.isReady}
        />
      )}
    </form.AppField>
  );
};
