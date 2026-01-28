import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const CommitMessagePattern: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField name={NAMES.commitMessagePattern}>
      {(field) => (
        <field.FormTextField
          label="Specify the pattern to validate a commit message"
          tooltipText={
            <>
              <p>Define a regular expression pattern to validate commit messages.</p>
              <p>This ensures consistency in your version control history. For example, use a pattern like</p>
              <p>"^(feat|fix|docs|style|refactor|test|chore): [A-Za-z]."</p>
            </>
          }
          placeholder="^\\[PROJECT_NAME-\\d{4}\\]:.*"
        />
      )}
    </form.AppField>
  );
};
