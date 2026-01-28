import React from "react";
import { codebaseTestReportFramework } from "@my-project/shared";
import { mapObjectValuesToSelectOptions } from "@/core/utils/forms/mapToSelectOptions";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const TestReportFramework: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.testReportFramework}
      validators={{
        onChange: ({ value }) => (!value ? "Select autotest report framework" : undefined),
      }}
    >
      {(field) => (
        <field.FormSelect
          label="Autotest report framework"
          options={mapObjectValuesToSelectOptions(codebaseTestReportFramework)}
        />
      )}
    </form.AppField>
  );
};
