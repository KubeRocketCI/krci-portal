import { NAMES } from "../../../constants";
import { useEditDefectDojoForm } from "../../../providers/form/hooks";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";
import { useStore } from "@tanstack/react-form";

interface URLProps {
  ownerReference: string | undefined;
}

export const URL: React.FC<URLProps> = ({ ownerReference }) => {
  const form = useEditDefectDojoForm();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Specify the URL where users can access the DefectDojo interface. Ensure to include the HTTP or HTTPS protocol (e.g., https://defectdojo.example.com)."
          placeholder="Enter URL"
          disabled={!!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
