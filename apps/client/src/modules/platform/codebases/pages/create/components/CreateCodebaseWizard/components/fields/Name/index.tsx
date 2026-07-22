import React from "react";
import { useCodebaseWatchList } from "@/k8s/api/groups/KRCI/Codebase";
import { sortByName } from "@/core/utils/sortByName";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";
import { nameSchema } from "../../../schema";

export const Name: React.FC = () => {
  const form = useCreateCodebaseForm();

  const codebaseListWatch = useCodebaseWatchList();

  // Changes only when name membership changes, so the revalidation effect below
  // ignores unrelated watch events (e.g. status updates)
  const existingNamesKey = React.useMemo(
    () =>
      (codebaseListWatch.data.array ?? [])
        .map((codebase) => codebase.metadata.name)
        .sort(sortByName)
        .join("\n"),
    [codebaseListWatch.data.array]
  );

  // Re-validate on list updates — validation otherwise runs only on change/blur/submit
  React.useEffect(() => {
    if (form.getFieldMeta(NAMES.name)?.isTouched) {
      form.validateField(NAMES.name, "change");
    }
  }, [existingNamesKey, form]);

  return (
    <form.AppField
      name={NAMES.name}
      validators={{
        onChange: ({ value }) => {
          const result = nameSchema.safeParse(value ?? "");
          if (!result.success) {
            return result.error.issues[0]?.message;
          }

          const isDuplicate = (codebaseListWatch.data.array ?? []).some(
            (codebase) => codebase.metadata.name === value.trim()
          );

          return isDuplicate ? "A project with this name already exists." : undefined;
        },
      }}
    >
      {(field) => <field.FormTextField label="Project Name" placeholder="Enter project name" />}
    </form.AppField>
  );
};
