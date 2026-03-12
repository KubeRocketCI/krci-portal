import { URL } from "./fields";
import { Globe } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";

export const JiraServerForm = () => {
  return (
    <FormSection icon={Globe} title="Connection Details">
      <URL />
    </FormSection>
  );
};
