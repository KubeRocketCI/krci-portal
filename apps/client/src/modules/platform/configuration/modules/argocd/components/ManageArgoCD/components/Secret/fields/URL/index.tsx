import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageArgoCDForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useManageArgoCDForm();
  const { mode, ownerReference } = useDataContext();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText={
            <>
              <p>
                Enter the URL of your Argo CD instance. Ensure to use the HTTPS protocol (e.g.,
                <em>https://argocd.example.com</em>).
              </p>
            </>
          }
          placeholder="Enter URL"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
