import { useCreateStageForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const Namespace = () => {
  const form = useCreateStageForm();

  return (
    <form.AppField
      name={NAMES.deployNamespace}
      validators={{
        onChange: ({ value }: { value: string }) => {
          if (!value) return "Namespace is required";
          if (value.length < 2) return "You must enter at least 2 characters";
          if (value.length > 63) return "You exceeded the maximum length of 63";
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
            return "Namespace must contain only lowercase letters, numbers, and dashes. It cannot start or end with a dash.";
          }
          return undefined;
        },
      }}
      children={(field) => <field.FormTextField label="Deploy Namespace" placeholder="Enter deploy namespace" />}
    />
  );
};
