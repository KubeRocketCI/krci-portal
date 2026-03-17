import { NAMES } from "../../../constants";
import { useCreateArgoCDForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useCreateArgoCDForm();
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
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
