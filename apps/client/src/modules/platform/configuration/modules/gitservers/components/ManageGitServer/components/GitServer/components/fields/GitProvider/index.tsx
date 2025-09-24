import React from "react";
import { useFormsContext } from "../../../../../hooks/useFormsContext";
import { GIT_SERVER_FORM_NAMES } from "../../../../../names";
import { GitProvider, gitProvider, gitUser } from "@my-project/shared";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { FieldEvent, FORM_MODES } from "@/core/types/forms";
import { FormRadioGroup } from "@/core/providers/Form/components/FormRadioGroup";
import { UseSpriteSymbol } from "@/k8s/icons/UseSpriteSymbol";
import { RESOURCE_ICON_NAMES } from "@/k8s/icons/sprites/Resources/names";
import { GIT_PROVIDER_ICON_MAPPING } from "@/k8s/configs/icon-mappings";
import { mapArrayToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";

const gitProviderOptions = mapArrayToSelectOptions(Object.values(gitProvider));

export const GitProviderField = () => {
  const {
    forms: { gitServer: gitServerForm },
    sharedForm,
  } = useFormsContext();

  const handleFieldValueChange = React.useCallback(
    ({ target: { value } }: FieldEvent) => {
      sharedForm.setValue(GIT_SERVER_FORM_NAMES.GIT_PROVIDER, value, { shouldDirty: false });

      if (gitServerForm.form.formState.dirtyFields?.gitUser) {
        return value;
      }

      switch (value) {
        case gitProvider.gerrit:
          gitServerForm.form.setValue(GIT_SERVER_FORM_NAMES.GIT_USER, gitUser.GERRIT);
          break;
        case gitProvider.github:
          gitServerForm.form.setValue(GIT_SERVER_FORM_NAMES.GIT_USER, gitUser.GITHUB);
          break;
        case gitProvider.gitlab:
          gitServerForm.form.setValue(GIT_SERVER_FORM_NAMES.GIT_USER, gitUser.GITLAB);
          break;
        case gitProvider.bitbucket:
          gitServerForm.form.setValue(GIT_SERVER_FORM_NAMES.GIT_USER, gitUser.BITBUCKET);
          break;
      }
    },
    [gitServerForm.form, sharedForm]
  );

  return (
    <>
      <K8sRelatedIconsSVGSprite />
      <FormRadioGroup
        {...gitServerForm.form.register(GIT_SERVER_FORM_NAMES.GIT_PROVIDER, {
          required: "Select your Git provider.",
          onChange: handleFieldValueChange,
        })}
        control={gitServerForm.form.control}
        errors={gitServerForm.form.formState.errors}
        label={"Git provider"}
        tooltipText={"Select your Git provider."}
        options={gitProviderOptions.map(({ label, value }) => {
          return {
            value,
            label,
            icon: (
              <UseSpriteSymbol
                name={GIT_PROVIDER_ICON_MAPPING?.[value as GitProvider] || RESOURCE_ICON_NAMES.OTHER}
                width={20}
                height={20}
              />
            ),
            checkedIcon: (
              <UseSpriteSymbol
                name={GIT_PROVIDER_ICON_MAPPING?.[value as GitProvider] || RESOURCE_ICON_NAMES.OTHER}
                width={20}
                height={20}
              />
            ),
          };
        })}
        disabled={gitServerForm.mode === FORM_MODES.EDIT}
      />
    </>
  );
};
