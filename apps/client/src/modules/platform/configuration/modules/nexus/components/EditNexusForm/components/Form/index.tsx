import React from "react";
import { ExternalURL, URL, User, Password } from "../fields";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";
import { FormSection } from "@/core/components/FormSection";
import { Alert } from "@/core/components/ui/alert";
import type { QuickLink } from "@my-project/shared";

export const Form: React.FC<{ quickLink: QuickLink | undefined; ownerReference: string | undefined }> = ({
  quickLink,
  ownerReference,
}) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        {!quickLink && (
          <Alert variant="default">
            Nexus QuickLink has not been found. Please, create it first in order to manage the integration.
          </Alert>
        )}
        <ExternalURL quickLink={quickLink} />
      </div>

      <FormSection icon={Globe} title="Connection Details">
        <URL ownerReference={ownerReference} />
      </FormSection>

      <Separator />

      <FormSection icon={Shield} title="Authentication">
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <User ownerReference={ownerReference} />
          </div>
          <div className="col-span-6">
            <Password ownerReference={ownerReference} />
          </div>
        </div>
      </FormSection>
    </div>
  );
};
