import { NAMES } from "../../../constants";
import { useEditArgoCDForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";
import { useStore } from "@tanstack/react-form";

interface URLProps {
  ownerReference: string | undefined;
}

export const URL: React.FC<URLProps> = ({ ownerReference }) => {
  const form = useEditArgoCDForm();
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
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
