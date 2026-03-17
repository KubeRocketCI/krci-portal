import { Button } from "@/core/components/ui/button";
import { useCreateJiraForm } from "../../providers/form/hooks";
import { useStore } from "@tanstack/react-form";

interface FormActionsProps {
  onClose: () => void;
}

export const FormActions = ({ onClose }: FormActionsProps) => {
  const form = useCreateJiraForm();
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  return (
    <>
      <Button onClick={onClose} variant="ghost" size="sm">
        Cancel
      </Button>
      <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
        Undo Changes
      </Button>
      <Button onClick={() => form.handleSubmit()} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
        Save
      </Button>
    </>
  );
};
