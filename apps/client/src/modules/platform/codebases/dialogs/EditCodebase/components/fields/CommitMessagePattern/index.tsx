import { EDIT_CODEBASE_FORM_NAMES } from "../../../types";
import { useEditCodebaseForm } from "../../../providers/form/hooks";

export const CommitMessagePattern = () => {
  const form = useEditCodebaseForm();

  return (
    <form.AppField name={EDIT_CODEBASE_FORM_NAMES.commitMessagePattern}>
      {(field) => (
        <field.FormTextField
          label="Specify the pattern to validate a commit message"
          tooltipText={
            <>
              <p>Define a regular expression pattern to validate commit messages.</p>
              <p>This ensures consistency in your version control history. For example, use a pattern like</p>
              <p>&quot;^(feat|fix|docs|style|refactor|test|chore): [A-Za-z].&quot;</p>
            </>
          }
          placeholder="^\[PROJECT_NAME-\d{4}\]:.*"
        />
      )}
    </form.AppField>
  );
};
