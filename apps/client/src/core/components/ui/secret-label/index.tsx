import React from "react";
import { KeyRound } from "lucide-react";

interface SecretLabelProps {
  label: React.ReactNode;
  showSecretIcon: boolean;
}

export function renderSecretLabel({ label, showSecretIcon }: SecretLabelProps): React.ReactNode {
  if (!label || !showSecretIcon) return label;

  return (
    <span className="inline-flex items-center gap-1.5">
      <KeyRound size={14} className="text-muted-foreground" />
      {label}
    </span>
  );
}
