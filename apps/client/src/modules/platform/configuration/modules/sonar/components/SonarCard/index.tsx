import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { getIntegrationSecretStatus, safeDecode, Secret, QuickLink } from "@my-project/shared";
import { Globe, Server, CheckCircle, XCircle, HelpCircle, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";
import { IntegrationCard } from "../../../../components/IntegrationCard";
import { SonarActionsMenu } from "../SonarActionsMenu";

interface SonarCardProps {
  secret: Secret;
  quickLink: QuickLink | undefined;
  ownerReference: string | undefined;
  onEdit: () => void;
}

function getStatusBadge(status: ReturnType<typeof getIntegrationSecretStatus>) {
  if (status.connected === undefined) {
    return (
      <Badge variant="outline" className="border-slate-300 bg-slate-100 text-slate-700">
        <HelpCircle className="mr-1 h-3 w-3" />
        Unknown
      </Badge>
    );
  }
  if (status.connected) {
    return (
      <Badge variant="outline" className="border-green-300 bg-green-100 text-green-700">
        <CheckCircle className="mr-1 h-3 w-3" />
        Connected
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-red-300 bg-red-100 text-red-700">
      <XCircle className="mr-1 h-3 w-3" />
      Disconnected
    </Badge>
  );
}

export function SonarCard({ secret, quickLink, ownerReference, onEdit }: SonarCardProps) {
  const status = getIntegrationSecretStatus(secret);
  const quickLinkUrl = quickLink?.spec?.url;
  const internalUrl = safeDecode(secret.data?.url || "");

  return (
    <IntegrationCard>
      <IntegrationCard.Header
        icon={<Server className="h-6 w-6 text-blue-600" />}
        title={secret.metadata.name}
        badge={getStatusBadge(status)}
        subtitle="SonarQube"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <MoreVertical className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <SonarActionsMenu secret={secret} ownerReference={ownerReference} onEdit={onEdit} />
          </DropdownMenu>
        }
      />
      <div className="divide-y divide-slate-100">
        {quickLinkUrl && (
          <IntegrationCard.LinkRow
            label="Public URL"
            href={quickLinkUrl}
            icon={<Globe className="h-4 w-4 text-blue-600" />}
          />
        )}
        {internalUrl && (
          <IntegrationCard.CopyableRow
            label="Internal URL"
            value={internalUrl}
            icon={<Server className="h-4 w-4 text-purple-600" />}
          />
        )}
        {ownerReference && <IntegrationCard.ManagedByRow text={ownerReference} />}
      </div>
    </IntegrationCard>
  );
}
