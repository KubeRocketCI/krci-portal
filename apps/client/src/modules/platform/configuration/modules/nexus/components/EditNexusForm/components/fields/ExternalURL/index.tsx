import { NAMES } from "../../../constants";
import { useEditNexusForm } from "../../../providers/form/hooks";
import { OpenExternalLinkButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";
import type { QuickLink } from "@my-project/shared";

export const ExternalURL: React.FC<{ quickLink: QuickLink | undefined }> = ({ quickLink }) => {
  const form = useEditNexusForm();
  const externalUrl = useStore(form.store, (state) => state.values[NAMES.EXTERNAL_URL]);

  return (
    <form.AppField name={NAMES.EXTERNAL_URL}>
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your Nexus instance."
          placeholder="Enter URL"
          disabled={!quickLink}
          suffix={<OpenExternalLinkButton getUrl={() => externalUrl} />}
        />
      )}
    </form.AppField>
  );
};
