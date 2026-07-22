import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { isGerritProvider } from "../../../utils";
import { useOnboardedRepoCheck } from "../../../hooks/useOnboardedRepoCheck";

export const GitUrlPath: React.FC = () => {
  const form = useCreateCodebaseForm();

  const { findOnboardedProject, membershipKey } = useOnboardedRepoCheck();

  // Re-validate on list updates — validation otherwise runs only on change/blur/submit
  React.useEffect(() => {
    if (form.getFieldMeta(NAMES.gitUrlPath)?.isTouched) {
      form.validateField(NAMES.gitUrlPath, "change");
    }
  }, [membershipKey, form]);

  return (
    <form.AppField
      name={NAMES.gitUrlPath}
      validators={{
        onChange: ({ value, fieldApi }) => {
          const isGerrit = isGerritProvider(fieldApi.form.getFieldValue(NAMES.ui_gitServerProvider));
          if (!isGerrit) {
            return undefined;
          }
          if (!value || value.length < 3) {
            return "Repository name has to be at least 3 characters long.";
          }

          const onboardedProject = findOnboardedProject(value);
          if (onboardedProject) {
            return `This repository is already onboarded as project "${onboardedProject}".`;
          }

          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Git URL Path" placeholder="Enter repository path" />}
    </form.AppField>
  );
};
