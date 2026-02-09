import React from "react";
import { useStore } from "@tanstack/react-form";
import { gitProvider } from "@my-project/shared";
import { useGitServerWatchItem } from "@/k8s/api/groups/KRCI/GitServer";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const RepositoryName: React.FC = () => {
  const form = useCreateCodebaseForm();
  const gitServerFieldValue = useStore(form.store, (s) => s.values[NAMES.gitServer]);

  const gitServerWatch = useGitServerWatchItem({ name: gitServerFieldValue });
  const gitServerProvider = gitServerWatch.data?.spec?.gitProvider;
  const isGerrit = gitServerProvider?.includes(gitProvider.gerrit);

  return (
    <form.AppField
      name={NAMES.ui_repositoryName}
      validators={{
        onChange: ({ value }) => {
          // Only validate if git server is NOT Gerrit
          if (isGerrit) {
            return undefined;
          }
          if (!value || value.trim().length === 0) return "Enter the repository name";
          if (value.length < 3) return "Repository name must be at least 3 characters long";
          return undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Repository Name" placeholder="Enter repository name" />}
    </form.AppField>
  );
};
