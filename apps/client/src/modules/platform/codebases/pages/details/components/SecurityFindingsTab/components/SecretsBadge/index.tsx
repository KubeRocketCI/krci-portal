import { Badge } from "@/core/components/ui/badge";

export interface SecretsBadgeProps {
  /** Active findings of the ExposedSecretReport test. `null`: the container has no such test. */
  active: number | null;
}

/** A secret is never added to the severity counts. */
export function SecretsBadge({ active }: SecretsBadgeProps) {
  if (active === null) {
    return (
      <Badge variant="neutral" role="img" aria-label="Exposed secrets: no report">
        Secrets —
      </Badge>
    );
  }

  return (
    <Badge variant={active > 0 ? "destructive" : "neutral"} role="img" aria-label={`Exposed secrets: ${active}`}>
      Secrets {active}
    </Badge>
  );
}
