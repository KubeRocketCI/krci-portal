import { useQuickLinkForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { useCurrentDialog } from "../../../providers/CurrentDialog/hooks";

export const Name = () => {
  const form = useQuickLinkForm();

  const {
    props: { isSystem },
  } = useCurrentDialog();

  return (
    <form.AppField
      name={NAMES.NAME}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Enter a component name.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Name"
          tooltipText="Enter a service name for the link. This name will be displayed on the overview page. Ensure the name is in lowercase."
          placeholder="My component name"
          disabled={isSystem}
        />
      )}
    </form.AppField>
  );
};
