import { Button } from "@/core/components/ui/button";
import {
  ConfigMap,
  Secret,
  containerRegistryType,
  containerRegistryTypeLabelMap,
  ContainerRegistryType,
} from "@my-project/shared";
import { MoreVertical, Server, Globe, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { IntegrationCard } from "../../../../components/IntegrationCard";
import { RegistryActionsMenu } from "../RegistryActionsMenu";

interface RegistryCardProps {
  EDPConfigMap: ConfigMap;
  pushAccountSecret: Secret | undefined;
  pullAccountSecret: Secret | undefined;
  onEdit: () => void;
  onReset: () => void;
}

export function RegistryCard({
  EDPConfigMap,
  pushAccountSecret,
  pullAccountSecret,
  onEdit,
  onReset,
}: RegistryCardProps) {
  const registryType = (EDPConfigMap?.data?.container_registry_type || "") as ContainerRegistryType;
  const registryEndpoint = EDPConfigMap?.data?.container_registry_host || "";
  const registrySpace = EDPConfigMap?.data?.container_registry_space || "";
  const awsRegion = EDPConfigMap?.data?.aws_region || "";

  const someOfTheSecretsHasExternalOwner =
    !!pushAccountSecret?.metadata?.ownerReferences || !!pullAccountSecret?.metadata?.ownerReferences;
  const needsServiceAccount = registryType === containerRegistryType.ecr;

  return (
    <IntegrationCard>
      <IntegrationCard.Header
        icon={<Package className="h-6 w-6 text-blue-600" />}
        title={containerRegistryTypeLabelMap[registryType]}
        subtitle="Container Registry"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <MoreVertical className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <RegistryActionsMenu
              EDPConfigMap={EDPConfigMap}
              pushAccountSecret={pushAccountSecret}
              pullAccountSecret={pullAccountSecret}
              onEdit={onEdit}
              onReset={onReset}
            />
          </DropdownMenu>
        }
      />
      <div className="divide-y divide-slate-100">
        <IntegrationCard.TextRow
          label="Registry Type"
          value={containerRegistryTypeLabelMap[registryType]}
          icon={<Server className="h-4 w-4 text-blue-600" />}
        />
        {registryEndpoint && (
          <IntegrationCard.CopyableRow
            label="Registry Endpoint"
            value={registryEndpoint}
            icon={<Globe className="h-4 w-4 text-purple-600" />}
          />
        )}
        {registrySpace && (
          <IntegrationCard.CopyableRow
            label="Registry Space"
            value={registrySpace}
            icon={<Package className="h-4 w-4 text-green-600" />}
            iconBoxClassName="bg-green-50"
          />
        )}
        {needsServiceAccount && awsRegion && (
          <IntegrationCard.TextRow
            label="AWS Region"
            value={awsRegion}
            icon={<Globe className="h-4 w-4 text-orange-600" />}
            iconBoxClassName="bg-orange-50"
          />
        )}
        {someOfTheSecretsHasExternalOwner && <IntegrationCard.ManagedByRow text="external owner" />}
      </div>
    </IntegrationCard>
  );
}
