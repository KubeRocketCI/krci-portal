import { useStore } from "@tanstack/react-form";
import { AWSRegion, RegistryEndpoint, RegistrySpace, Type } from "./fields";
import { containerRegistryType } from "@my-project/shared";
import { useManageRegistryForm } from "../../providers/form/hooks";
import { NAMES } from "../../schema";
import { Card } from "@/core/components/ui/card";
import { Boxes } from "lucide-react";

export const ConfigMapForm = () => {
  const form = useManageRegistryForm();

  const registryTypeFieldValue = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <Card className="border-input border bg-transparent p-3">
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-4 w-4 text-blue-600" />
        <h5 className="text-foreground text-sm font-medium">Registry Configuration</h5>
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <Type />
        </div>
        <div>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-6">
              <RegistryEndpoint />
            </div>
            <div className="col-span-6">
              <RegistrySpace />
            </div>
          </div>
        </div>
        {registryTypeFieldValue === containerRegistryType.ecr && (
          <div>
            <AWSRegion />
          </div>
        )}
      </div>
    </Card>
  );
};
