import React from "react";
import { useStore } from "@tanstack/react-form";
import { gitProvider } from "@my-project/shared";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const GitUrlPath: React.FC = () => {
  const form = useCreateCodebaseForm();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);

  const gitServerWatch = useGitServerWatchItem({ name: gitServerFieldValue });
  const gitServerProvider = gitServerWatch.data?.spec?.gitProvider;
  const isGerrit = gitServerProvider?.includes(gitProvider.gerrit);

  return (
    <form.AppField
      name={NAMES.gitUrlPath}
      validators={{
        onChange: ({ value }) => {
          // Only validate if git server is Gerrit
          if (!isGerrit) {
            return undefined;
          }
          if (!value || value.length < 3) {
            return "Repository name has to be at least 3 characters long.";
          }
          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Git URL Path" placeholder="Enter repository path" />}
    </form.AppField>
  );
};
