import React from "react";
import { useCreateCodebaseForm } from "../../../providers/form/hooks";
import { NAMES } from "../../../names";

export const TicketNamePattern: React.FC = () => {
  const form = useCreateCodebaseForm();

  return (
    <form.AppField
      name={NAMES.ticketNamePattern}
      validators={{
        onChange: ({ value }) => {
          if (!value) return "Specify the pattern to find a Jira ticket number in a commit message.";
          return undefined;
        },
      }}
    >
      {(field) => (
        <field.FormTextField
          label="Specify the pattern to find a Jira ticket number in a commit message"
          tooltipText={
            <>
              <p>Set a regular expression pattern to identify Jira ticket numbers in commit messages.</p>
              <p>This facilitates seamless integration with your issue tracking system. An example pattern could be</p>
              <p>&quot;(JIRA|jira|Issue|issue) [A-Z]+-[0-9]+&quot;</p>
            </>
          }
          placeholder="PROJECT_NAME-\d{4}"
        />
      )}
    </form.AppField>
  );
};
