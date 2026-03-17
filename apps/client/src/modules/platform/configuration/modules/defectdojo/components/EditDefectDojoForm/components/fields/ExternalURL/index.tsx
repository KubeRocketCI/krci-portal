import type { QuickLink } from "@my-project/shared";
import { NAMES } from "../../../constants";
import { useEditDefectDojoForm } from "../../../providers/form/hooks";
import { OpenExternalLinkButton } from "@/core/components/FieldSuffixButtons";
import { useStore } from "@tanstack/react-form";

interface ExternalURLProps {
  quickLink: QuickLink | undefined;
}

export const ExternalURL: React.FC<ExternalURLProps> = ({ quickLink }) => {
  const form = useEditDefectDojoForm();
  const externalUrl = useStore(form.store, (state) => state.values[NAMES.EXTERNAL_URL]);

  return (
    <form.AppField name={NAMES.EXTERNAL_URL}>
      {(field) => (
        <field.FormTextField
          label="Quick Link URL"
          tooltipText="Enter the external URL of your DefectDojo instance."
          placeholder="Enter URL"
          disabled={!quickLink}
          suffix={<OpenExternalLinkButton getUrl={() => externalUrl} />}
        />
      )}
    </form.AppField>
  );
};
