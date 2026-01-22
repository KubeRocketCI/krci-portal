import { useQuickLinkForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Visible = () => {
  const form = useQuickLinkForm();

  return (
    <form.AppField name={NAMES.VISIBLE}>
      {(field) => (
        <field.FormSwitch
          label="Show on Overview Page"
          helperText="Display this component in the Overview page for quick access."
          rich
          variant="card"
        />
      )}
    </form.AppField>
  );
};
