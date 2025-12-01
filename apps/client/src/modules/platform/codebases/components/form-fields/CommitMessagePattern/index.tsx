import React from "react";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormContext } from "react-hook-form";
import { CREATE_WIZARD_NAMES } from "../names";

interface CommitMessagePatternFieldProps {
  name?: string;
}

export const CommitMessagePatternField: React.FC<CommitMessagePatternFieldProps> = ({
  name = CREATE_WIZARD_NAMES.commitMessagePattern,
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextField
      {...register(name)}
      label={"Specify the pattern to validate a commit message"}
      tooltipText={
        <>
          <p>Define a regular expression pattern to validate commit messages.</p>
          <p>This ensures consistency in your version control history. For example, use a pattern like</p>
          <p>"^(feat|fix|docs|style|refactor|test|chore): [A-Za-z]."</p>
        </>
      }
      placeholder={"^\\[PROJECT_NAME-\\d{4}\\]:.*"}
      control={control}
      errors={errors}
    />
  );
};
