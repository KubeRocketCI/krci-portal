import React from "react";
import { ConfigMapForm } from "../ConfigMap";
import { ServiceAccountForm } from "../ServiceAccount";
import { PushAccountForm } from "../PushAccount";
import { PullAccountForm } from "../PullAccount";
import { UseSameAccount } from "../fields";
import { Separator } from "@/core/components/ui/separator";
import { ContainerRegistryPlatform, Secret } from "@my-project/shared";

interface FormProps {
  platform?: ContainerRegistryPlatform;
  pushAccountSecret?: Secret;
  pullAccountSecret?: Secret;
}

export const Form: React.FC<FormProps> = ({ platform, pushAccountSecret, pullAccountSecret }) => {
  const someOfTheSecretsHasExternalOwner =
    !!pushAccountSecret?.metadata?.ownerReferences || !!pullAccountSecret?.metadata?.ownerReferences;

  return (
    <div className="flex flex-col gap-4">
      <ConfigMapForm platform={platform} />

      <Separator />

      <ServiceAccountForm />

      <Separator />

      <PushAccountForm pushAccountSecret={pushAccountSecret} />

      <Separator />

      <div className="flex flex-col gap-6">
        <UseSameAccount disabled={someOfTheSecretsHasExternalOwner} />
        <PullAccountForm pullAccountSecret={pullAccountSecret} />
      </div>
    </div>
  );
};
