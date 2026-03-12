import { URL } from "./fields";
import { Card } from "@/core/components/ui/card";
import { Globe } from "lucide-react";

export const JiraServerForm = () => {
  return (
    <Card className="border-input border bg-transparent p-3">
      <div className="mb-4 flex items-center gap-2">
        <Globe className="h-4 w-4 text-blue-600" />
        <h5 className="text-foreground text-sm font-medium">Connection Details</h5>
      </div>
      <URL />
    </Card>
  );
};
