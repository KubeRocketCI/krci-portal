import { VALIDATED_PROTOCOL } from "@/k8s/constants/validatedProtocols";
import { useQuickLinkForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { getValidURLPattern } from "@/core/utils/getValidURLPattern";

export const URL = () => {
  const form = useQuickLinkForm();
  const urlPattern = getValidURLPattern(VALIDATED_PROTOCOL.HTTP_OR_HTTPS);

  return (
    <form.AppField
      name={NAMES.URL}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter service endpoint URL.";
          if (!urlPattern.test(value)) {
            return "Enter a valid URL with HTTP/HTTPS protocol.";
          }
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="URL"
          tooltipText="Specify the full URL including the protocol (e.g., https://example.com). This is the destination users will be redirected to when clicking the link."
          placeholder="https://example.com"
        />
      )}
    </form.AppField>
  );
};
