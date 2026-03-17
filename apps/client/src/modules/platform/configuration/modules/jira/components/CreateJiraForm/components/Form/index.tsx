import React from "react";
import { URL, Username, Password } from "../fields";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";
import { Alert } from "@/core/components/ui/alert";

export const Form: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <Alert variant="default">
        Creating a new Jira integration. Enter your Jira instance details and credentials.
      </Alert>

      <FormSection icon={Globe} title="Jira Instance">
        <URL />
      </FormSection>

      <Separator />

      <FormSection icon={Shield} title="Authentication">
        <Username />
        <Password />
      </FormSection>
    </div>
  );
};
