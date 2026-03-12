import { Password, URL, User } from "./fields";
import { Card } from "@/core/components/ui/card";
import { Separator } from "@/core/components/ui/separator";
import { Globe, Shield } from "lucide-react";

export const SecretForm = () => {
  return (
    <div className="flex flex-col gap-4">
      <Card className="border-input border bg-transparent p-3">
        <div className="mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-blue-600" />
          <h5 className="text-foreground text-sm font-medium">Connection Details</h5>
        </div>
        <URL />
      </Card>

      <Separator />

      <Card className="border-input border bg-transparent p-3">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          <h5 className="text-foreground text-sm font-medium">Authentication</h5>
        </div>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <User />
          </div>
          <div className="col-span-6">
            <Password />
          </div>
        </div>
      </Card>
    </div>
  );
};
