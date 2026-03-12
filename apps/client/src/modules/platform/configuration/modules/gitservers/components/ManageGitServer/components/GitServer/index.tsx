import {
  GitProviderField,
  HostName,
  HTTPSPort,
  Name,
  OverrideWebhookURL,
  SkipWebHookSSL,
  SSHPort,
  TektonDisabled,
  UserName,
} from "./components/fields";
import { Card } from "@/core/components/ui/card";
import { Boxes } from "lucide-react";

export const GitServerForm = () => {
  return (
    <Card className="border-input border bg-transparent p-3">
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-4 w-4 text-blue-600" />
        <h5 className="text-foreground text-sm font-medium">Server Configuration</h5>
      </div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <GitProviderField />
        </div>
        <div className="col-span-6">
          <Name />
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <HostName />
            </div>
            <div className="col-span-6">
              <UserName />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <SSHPort />
            </div>
            <div className="col-span-6">
              <HTTPSPort />
            </div>
          </div>
        </div>
        <div className="col-span-12">
          <OverrideWebhookURL />
        </div>
        <div className="col-span-12">
          <SkipWebHookSSL />
        </div>
        <div className="col-span-12">
          <TektonDisabled />
        </div>
      </div>
    </Card>
  );
};
