import { ConfigMap, Secret, ServiceAccount } from "@my-project/shared";

export interface CreateRegistryFormProps {
  EDPConfigMap: ConfigMap | undefined;
  pullAccountSecret: Secret | undefined;
  pushAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
  onClose: () => void;
}

export type { CreateRegistryFormValues } from "./schema";
