import { ConfigMap, Secret, ServiceAccount } from "@my-project/shared";

export interface EditRegistryFormProps {
  EDPConfigMap: ConfigMap;
  pullAccountSecret: Secret | undefined;
  pushAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
  onClose: () => void;
}

export type { EditRegistryFormValues } from "./schema";
