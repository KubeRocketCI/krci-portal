import { ShieldAlert } from "lucide-react";

interface ManagedByHelperProps {
  ownerReference: string;
}

export const ManagedByHelper = ({ ownerReference }: ManagedByHelperProps) => {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-blue-400">
      <ShieldAlert size={14} className="shrink-0" />
      <span>Managed by {ownerReference}</span>
    </span>
  );
};
