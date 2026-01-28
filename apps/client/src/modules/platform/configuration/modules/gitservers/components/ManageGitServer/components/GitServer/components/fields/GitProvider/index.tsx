import React from "react";
import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";
import { GitProvider as GitProviderType, gitProvider } from "@my-project/shared";
import { GIT_PROVIDER_ICON_MAPPING } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { FORM_MODES } from "@/core/types/forms";
import { useDataContext } from "../../../../../providers/Data/hooks";

const gitProviderOptions = mapArrayToSelectOptions(Object.values(gitProvider));

export const GitProviderField = () => {
  const form = useManageGitServerForm();
  const { gitServer } = useDataContext();
  const mode = gitServer ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const options = React.useMemo(
    () =>
      gitProviderOptions.map(({ label, value }) => ({
        value,
        label,
        icon: (
          <UseSpriteSymbol
            name={GIT_PROVIDER_ICON_MAPPING?.[value as GitProviderType] || RESOURCE_ICON_NAMES.OTHER}
            width={20}
            height={20}
          />
        ),
      })),
    []
  );

  return (
    <form.AppField name={NAMES.GIT_PROVIDER}>
      {(field) => (
        <field.FormSelect
          label="Git provider"
          tooltipText="Select your Git provider."
          placeholder="Select Git provider"
          options={options}
          disabled={mode === FORM_MODES.EDIT}
        />
      )}
    </form.AppField>
  );
};
