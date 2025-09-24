import {
  editKRCIConfigMapRegistryData,
  editRegistryServiceAccount,
  containerRegistryType,
  ConfigMap,
  Secret,
  ServiceAccount,
} from "@my-project/shared";
import { useConfigMapCRUD } from "@/k8s/api/groups/Core/ConfigMap";
import { useSecretCRUD } from "@/k8s/api/groups/Core/Secret";
import { useServiceAccountCRUD } from "@/k8s/api/groups/Core/ServiceAccount";

export const useResetRegistry = ({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  tektonServiceAccount,
  onSuccess,
}: {
  EDPConfigMap: ConfigMap | undefined;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
  tektonServiceAccount: ServiceAccount | undefined;
  onSuccess: () => void;
}) => {
  const registryType = EDPConfigMap?.data?.container_registry_type;
  const secretsArray = [pushAccountSecret, pullAccountSecret].filter(Boolean);

  const {
    triggerEditConfigMap,
    mutations: { configMapEditMutation },
  } = useConfigMapCRUD();

  const {
    triggerDeleteSecret,
    mutations: { secretDeleteMutation },
  } = useSecretCRUD();

  const {
    triggerEditServiceAccount,
    mutations: { serviceAccountEditMutation },
  } = useServiceAccountCRUD();

  const isLoading =
    serviceAccountEditMutation.isPending || secretDeleteMutation.isPending || configMapEditMutation.isPending;

  const resetRegistry = async () => {
    if (!EDPConfigMap) {
      return;
    }

    const resetECR = async () => {
      const newEDPConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
        registryType: containerRegistryType.ecr,
        registryEndpoint: "",
        registrySpace: "",
        awsRegion: "",
      });

      if (tektonServiceAccount) {
        const editedServiceAccount = editRegistryServiceAccount(tektonServiceAccount, {
          irsaRoleArn: "",
        });
        await triggerEditServiceAccount({
          data: { resource: editedServiceAccount },
        });
      }

      for (const secret of secretsArray) {
        if (!secret) {
          continue;
        }

        await triggerDeleteSecret({
          data: { resource: secret },
        });
      }

      await triggerEditConfigMap({
        data: { resource: newEDPConfigMap },
        callbacks: { onSuccess },
      });
    };

    const resetDockerHub = async () => {
      const newEDPConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
        registryType: containerRegistryType.dockerhub,
        registrySpace: "",
      });

      for (const secret of secretsArray) {
        if (!secret) {
          continue;
        }

        await triggerDeleteSecret({
          data: { resource: secret },
        });
      }
      await triggerEditConfigMap({
        data: { resource: newEDPConfigMap },
        callbacks: { onSuccess },
      });
    };

    const resetGHCR = async () => {
      const newEDPConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
        registryType: containerRegistryType.ghcr,
        registrySpace: "",
      });

      for (const secret of secretsArray) {
        if (!secret) {
          continue;
        }

        await triggerDeleteSecret({
          data: { resource: secret },
        });
      }
      await triggerEditConfigMap({
        data: { resource: newEDPConfigMap },
        callbacks: { onSuccess },
      });
    };

    const resetHarbor = async () => {
      const newEDPConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
        registryType: containerRegistryType.harbor,
        registrySpace: "",
        registryEndpoint: "",
      });

      for (const secret of secretsArray) {
        if (!secret) {
          continue;
        }

        await triggerDeleteSecret({
          data: { resource: secret },
        });
      }
      await triggerEditConfigMap({
        data: { resource: newEDPConfigMap },
        callbacks: { onSuccess },
      });
    };

    const resetNexus = async () => {
      const newEDPConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
        registryType: containerRegistryType.nexus,
        registrySpace: "",
        registryEndpoint: "",
      });

      for (const secret of secretsArray) {
        if (!secret) {
          continue;
        }

        await triggerDeleteSecret({
          data: { resource: secret },
        });
      }
      await triggerEditConfigMap({
        data: { resource: newEDPConfigMap },
        callbacks: { onSuccess },
      });
    };

    const resetOpenshift = async () => {
      const newEDPConfigMap = editKRCIConfigMapRegistryData(EDPConfigMap, {
        registryType: containerRegistryType.openshift,
        registrySpace: "",
        registryEndpoint: "",
      });

      if (pushAccountSecret) {
        await triggerDeleteSecret({
          data: { resource: pushAccountSecret },
        });
      }

      await triggerEditConfigMap({
        data: { resource: newEDPConfigMap },
        callbacks: { onSuccess },
      });
    };

    switch (registryType) {
      case containerRegistryType.ecr:
        await resetECR();
        break;
      case containerRegistryType.dockerhub:
        await resetDockerHub();
        break;
      case containerRegistryType.ghcr:
        await resetGHCR();
        break;
      case containerRegistryType.harbor:
        await resetHarbor();
        break;
      case containerRegistryType.nexus:
        await resetNexus();
        break;
      case containerRegistryType.openshift:
        await resetOpenshift();
        break;
    }
  };

  return { resetRegistry, isLoading };
};
