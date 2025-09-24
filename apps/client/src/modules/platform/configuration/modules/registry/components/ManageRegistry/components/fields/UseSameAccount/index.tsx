import React from "react";
import { useRegistryFormsContext } from "../../../hooks/useRegistryFormsContext";
import { PULL_ACCOUNT_FORM_NAMES, PUSH_ACCOUNT_FORM_NAMES, SHARED_FORM_NAMES } from "../../../names";
import { useDataContext } from "../../../providers/Data/hooks";
import { FormCheckbox } from "@/core/providers/Form/components/FormCheckbox";
import { FormControlLabelWithTooltip } from "@/core/providers/Form/components/FormControlLabelWithTooltip";
import { FieldEvent } from "@/core/types/forms";

export const UseSameAccount = () => {
  const { pushAccountSecret, pullAccountSecret } = useDataContext();
  const {
    forms: { pushAccount, pullAccount },
    sharedForm,
  } = useRegistryFormsContext();

  const pushAccountUserNameFieldValue = pushAccount.form.watch(PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_USER);
  const pushAccountPasswordFieldValue = pushAccount.form.watch(PUSH_ACCOUNT_FORM_NAMES.PUSH_ACCOUNT_PASSWORD);

  const someOfTheSecretsHasExternalOwner = React.useMemo(() => {
    return !!pushAccountSecret?.metadata?.ownerReferences || !!pullAccountSecret?.metadata?.ownerReferences;
  }, [pushAccountSecret, pullAccountSecret]);

  return (
    <FormCheckbox
      {...sharedForm.register(SHARED_FORM_NAMES.USE_SAME_ACCOUNT, {
        onChange: ({ target: { value } }: FieldEvent) => {
          if (value) {
            pullAccount.form.setValue(PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_USER, pushAccountUserNameFieldValue, {
              shouldDirty: true,
            });
            pullAccount.form.setValue(PULL_ACCOUNT_FORM_NAMES.PULL_ACCOUNT_PASSWORD, pushAccountPasswordFieldValue, {
              shouldDirty: true,
            });
          }
        },
      })}
      label={
        <FormControlLabelWithTooltip
          label={`Use the Push Account's credentials`}
          title={"Enables using the same account for both pull and push purposes."}
        />
      }
      control={sharedForm.control}
      errors={sharedForm.formState.errors}
      disabled={someOfTheSecretsHasExternalOwner}
    />
  );
};
