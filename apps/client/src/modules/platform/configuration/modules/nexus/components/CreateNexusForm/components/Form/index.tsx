import React from "react";
import { ExternalURL, URL, User, Password } from "../fields";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";
import { Alert } from "@/core/components/ui/alert";

export const Form: React.FC = () => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Alert variant="default">
          Creating a new Nexus integration. The Quick Link URL will be synced automatically with the Connection URL.
        </Alert>
        <ExternalURL />
      </div>

      <FormSection icon={Globe} title="Connection Details">
        <URL />
      </FormSection>

      <Separator />

      <FormSection icon={Shield} title="Authentication">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <User />
          </div>
          <div className="col-span-6">
            <Password />
          </div>
        </div>
      </FormSection>
    </div>
  );
};
