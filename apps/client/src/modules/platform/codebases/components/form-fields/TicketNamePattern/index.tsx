import React from "react";
import { FormTextField } from "@/core/providers/Form/components/FormTextField";
import { useFormContext } from "react-hook-form";
import { CREATE_WIZARD_NAMES } from "../names";

interface TicketNamePatternFieldProps {
  name?: string;
}

export const TicketNamePatternField: React.FC<TicketNamePatternFieldProps> = ({
  name = CREATE_WIZARD_NAMES.ticketNamePattern,
}) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext();

  return (
    <FormTextField
      {...register(name, {
        required: "Specify the pattern to find a Jira ticket number in a commit message.",
      })}
      label={"Specify the pattern to find a Jira ticket number in a commit message"}
      tooltipText={
        <>
          <p>Set a regular expression pattern to identify Jira ticket numbers in commit messages.</p>
          <p>This facilitates seamless integration with your issue tracking system. An example pattern could be</p>
          <p>"(JIRA|jira|Issue|issue) [A-Z]+-[0-9]+"</p>
        </>
      }
      placeholder={"PROJECT_NAME-\\d{4}"}
      control={control}
      errors={errors}
    />
  );
};
