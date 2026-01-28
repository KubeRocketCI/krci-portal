import React from "react";
import { NAMES } from "../../../../../names";
import { useManageGitServerForm } from "../../../../../providers/form/hooks";
import { GitProvider as GitProviderType, gitProvider, gitUser } from "@my-project/shared";
import { GIT_PROVIDER_ICON_MAPPING } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { RESOURCE_ICON_NAMES } from "@/k8s/api/groups/KRCI/Codebase/utils/icon-mappings";
import { UseSpriteSymbol } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { FORM_MODES } from "@/core/types/forms";
import { useDataContext } from "../../../../../providers/Data/hooks";
import { createGitServerSecretName } from "@my-project/shared";

const gitProviderOptions = mapArrayToSelectOptions(Object.values(gitProvider));

export const GitProviderField = () => {
  const form = useManageGitServerForm();
  const { gitServer } = useDataContext();
  const mode = gitServer ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  return (
    <form.AppField name={NAMES.GIT_PROVIDER}>
      {(field) => (
        <field.FormRadioGroup
          label="Git provider"
          tooltipText="Select your Git provider."
          options={gitProviderOptions.map(({ label, value }) => ({
            value,
            label,
            icon: (
              <UseSpriteSymbol
                name={GIT_PROVIDER_ICON_MAPPING?.[value as GitProviderType] || RESOURCE_ICON_NAMES.OTHER}
                width={20}
                height={20}
              />
            ),
            checkedIcon: (
              <UseSpriteSymbol
                name={GIT_PROVIDER_ICON_MAPPING?.[value as GitProviderType] || RESOURCE_ICON_NAMES.OTHER}
                width={20}
                height={20}
              />
            ),
          }))}
          disabled={mode === FORM_MODES.EDIT}
        />
      )}
    </form.AppField>
  );
};
