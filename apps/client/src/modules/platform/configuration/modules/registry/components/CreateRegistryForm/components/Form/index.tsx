import React from "react";
import { ConfigMapForm } from "../ConfigMap";
import { ServiceAccountForm } from "../ServiceAccount";
import { PushAccountForm } from "../PushAccount";
import { PullAccountForm } from "../PullAccount";
import { UseSameAccount } from "../fields";
import { Separator } from "@/core/components/ui/separator";
import { ContainerRegistryPlatform } from "@my-project/shared";

interface FormProps {
  platform?: ContainerRegistryPlatform;
}

export const Form: React.FC<FormProps> = ({ platform }) => {
  return (
    <div className="flex flex-col gap-4">
      <ConfigMapForm platform={platform} />

      <Separator />

      <ServiceAccountForm />

      <Separator />

      <PushAccountForm />

      <Separator />

      <div className="flex flex-col gap-6">
        <UseSameAccount />
        <PullAccountForm />
      </div>
    </div>
  );
};
