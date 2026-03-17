import { Button } from "@/core/components/ui/button";
import React from "react";
import { useStore } from "@tanstack/react-form";
import { FORM_MODES } from "@/core/types/forms";
import { useDataContext } from "../../providers/Data/hooks";
import { useManageRegistryForm } from "../../providers/form/hooks";

export const Actions = ({ handleCloseCreateDialog }: { handleCloseCreateDialog: (() => void) | undefined }) => {
  const form = useManageRegistryForm();
  const { EDPConfigMap } = useDataContext();

  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const mode = EDPConfigMap?.data?.container_registry_type ? FORM_MODES.EDIT : FORM_MODES.CREATE;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    form.handleSubmit();
  };

  return (
    <div className="flex flex-row items-center justify-between gap-4">
      {mode === FORM_MODES.CREATE && (
        <Button onClick={handleCloseCreateDialog} variant="ghost" size="sm">
          Cancel
        </Button>
      )}

      <div className="ml-auto flex flex-row items-center gap-4">
        <Button onClick={() => form.reset()} size="sm" variant="ghost" disabled={!isDirty}>
          Undo Changes
        </Button>
        <Button onClick={handleSubmit} size="sm" variant="default" disabled={!isDirty || isSubmitting}>
          Save
        </Button>
      </div>
    </div>
  );
};
