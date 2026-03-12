import { NAMES } from "../../../../names";
import { useDataContext } from "../../../../providers/Data/hooks";
import { useManageDefectDojoForm } from "../../../../providers/form/hooks";
import { FORM_MODES } from "@/core/types/forms";
import { CopyToClipboardButton } from "@/core/components/FieldSuffixButtons";
import { ManagedByHelper } from "@/core/components/ManagedByHelper";
import { useStore } from "@tanstack/react-form";

export const URL = () => {
  const form = useManageDefectDojoForm();
  const { mode, ownerReference } = useDataContext();
  const url = useStore(form.store, (state) => state.values[NAMES.URL]);

  return (
    <form.AppField name={NAMES.URL}>
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Specify the URL where users can access the DefectDojo interface. Ensure to include the HTTP or HTTPS protocol (e.g., https://defectdojo.example.com)."
          placeholder="Enter URL"
          disabled={mode === FORM_MODES.EDIT && !!ownerReference}
          helperText={ownerReference ? <ManagedByHelper ownerReference={ownerReference} /> : undefined}
          suffix={<CopyToClipboardButton getValue={() => url} />}
        />
      )}
    </form.AppField>
  );
};
