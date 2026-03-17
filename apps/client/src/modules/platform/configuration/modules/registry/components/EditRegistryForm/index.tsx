import { useManageRegistryForm } from "../ManageRegistry/providers/form/hooks";
import { ConfigMapForm } from "../ManageRegistry/components/ConfigMap";
import { UseSameAccount } from "../ManageRegistry/components/fields";
import { PullAccountForm } from "../ManageRegistry/components/PullAccount";
import { PushAccountForm } from "../ManageRegistry/components/PushAccount";
import { ServiceAccountForm } from "../ManageRegistry/components/ServiceAccount";
import { NAMES } from "../ManageRegistry/schema";
import { useStore } from "@tanstack/react-form";
import { containerRegistryType } from "@my-project/shared";
import { satisfiesType } from "../../utils";

/**
 * Form content for editing container registry integration.
 * Must be rendered inside ManageRegistryFormProvider and DataContextProvider
 * (e.g. from EditRegistryDialog).
 */
export function EditRegistryForm() {
  const form = useManageRegistryForm();
  const registryType = useStore(form.store, (state) => state.values[NAMES.REGISTRY_TYPE]);

  return (
    <div className="flex flex-col gap-6">
      <ConfigMapForm />
      {satisfiesType(registryType, [containerRegistryType.ecr]) && (
        <>
          <ServiceAccountForm />
        </>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.openshift,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <>
          <PushAccountForm />
        </>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <>
          <UseSameAccount />
        </>
      )}
      {satisfiesType(registryType, [
        containerRegistryType.harbor,
        containerRegistryType.nexus,
        containerRegistryType.dockerhub,
        containerRegistryType.ghcr,
      ]) && (
        <>
          <PullAccountForm />
        </>
      )}
    </div>
  );
}
