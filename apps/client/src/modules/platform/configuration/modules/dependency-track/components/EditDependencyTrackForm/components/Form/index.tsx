import React from "react";
import type { QuickLink } from "@my-project/shared";
import { ExternalURL, URL, Token } from "../fields";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";
import { Alert } from "@/core/components/ui/alert";

interface FormProps {
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
}

export const Form: React.FC<FormProps> = ({ quickLink, ownerReference }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {!quickLink && (
          <div>
            <Alert variant="default">
              Dependency-Track QuickLink has not been found. Please, create it first in order to manage the integration.
            </Alert>
          </div>
        )}
        <ExternalURL quickLink={quickLink} />
      </div>

      <FormSection icon={Globe} title="Connection Details">
        <URL ownerReference={ownerReference} />
      </FormSection>

      <Separator />

      <FormSection icon={Shield} title="Authentication">
        <Token ownerReference={ownerReference} />
      </FormSection>
    </div>
  );
};
