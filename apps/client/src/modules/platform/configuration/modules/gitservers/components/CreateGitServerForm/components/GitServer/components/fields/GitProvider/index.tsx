import React from "react";
import { NAMES } from "../../../../../constants";
import { useCreateGitServerForm } from "../../../../../providers/form/hooks";
import { GitProvider as GitProviderType, gitProvider } from "@my-project/shared";
import { GIT_PROVIDER_ICON_MAPPING } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { getDefaultGitUser } from "../../../../../utils/getDefaultGitUser";
import { useGitServerWatchList } from "@/k8s/api/groups/KRCI/GitServer";
import { getUsedGitProviders } from "@/modules/platform/configuration/modules/gitservers/utils/getUsedGitProviders";
import { getDefaultGitProvider } from "../../../../../utils/getDefaultGitProvider";

const gitProviderOptions = mapArrayToSelectOptions(Object.values(gitProvider));

export const GitProviderField = () => {
  const form = useCreateGitServerForm();

  const gitServersWatch = useGitServerWatchList();

  const usedProviders = React.useMemo(
    () => getUsedGitProviders(gitServersWatch.data.array),
    [gitServersWatch.data.array]
  );

  const options = React.useMemo(
    () =>
      gitProviderOptions.map(({ label, value }) => ({
        value,
        label,
        disabled: usedProviders.has(value as GitProviderType),
        icon: (
          <UseSpriteSymbol
            name={GIT_PROVIDER_ICON_MAPPING?.[value as GitProviderType] || RESOURCE_ICON_NAMES.OTHER}
            width={20}
            height={20}
          />
        ),
      })),
    [usedProviders]
  );

  const helperText = gitServersWatch.error
    ? "Existing Git Servers could not be loaded. A Git Server cannot be created."
    : !gitServersWatch.isLoading && !getDefaultGitProvider(usedProviders)
      ? "Every Git provider already has a Git Server."
      : undefined;

  return (
    <form.AppField
      name={NAMES.GIT_PROVIDER}
      listeners={{
        onChange: ({ value }) => {
          if (value) {
            form.setFieldValue(NAMES.GIT_USER, getDefaultGitUser(value));
          }
        },
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Git provider"
          tooltipText="Select your Git provider. One Git Server per provider is supported; providers that already have a Git Server are disabled."
          placeholder="Select Git provider"
          options={options}
          disabled={gitServersWatch.isLoading || !!gitServersWatch.error}
          helperText={helperText}
        />
      )}
    </form.AppField>
  );
};
