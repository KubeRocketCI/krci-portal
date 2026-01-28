import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageArgoCDForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";

export const URL = () => {
  const form = useManageArgoCDForm();
  const { mode, ownerReference } = useDataContext();

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
          helperText={ownerReference ? `This field value is managed by ${ownerReference}` : undefined}
        />
      )}
    </form.AppField>
  );
};
