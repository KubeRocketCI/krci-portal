import React from "react";
import { useStore } from "@tanstack/react-form";
import { useCreateCodebaseForm } from "../../providers/form/hooks";
import { NAMES } from "../../names";
import { CreationMethod, CodebaseType, CreationStrategy, TemplateSelection } from "../fields";

export const InitialSelection: React.FC = () => {
  const form = useCreateCodebaseForm();

  const creationMethodFieldValue = useStore(form.store, (state) => state.values[NAMES.ui_creationMethod] ?? null);
  const typeFieldValue = useStore(form.store, (state) => state.values[NAMES.type] ?? null);

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex-1 space-y-6">
        <CreationMethod />

        {creationMethodFieldValue === "template" && <TemplateSelection />}

        {creationMethodFieldValue === "custom" && (
          <>
            <CodebaseType />

            {typeFieldValue && <CreationStrategy />}
          </>
        )}
      </div>
    </div>
  );
};
