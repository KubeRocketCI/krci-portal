import React from "react";
import { Cluster, StageName, Namespace, Description } from "../fields";

export const BasicConfiguration: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-foreground mb-2 text-lg font-semibold">Basic Configuration</h2>
        <p className="text-muted-foreground text-sm">
          Configure the basic settings for your new environment including cluster, name, namespace, and description.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="col-span-1 md:col-span-2">
          <Cluster />
        </div>
        <div>
          <StageName />
        </div>
        <div>
          <Namespace />
        </div>
        <div className="col-span-1 md:col-span-2">
          <Description />
        </div>
      </div>
    </div>
  );
};
