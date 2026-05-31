import { Card, CardContent, CardHeader, CardTitle } from "@/core/components/ui/card";

interface WorkloadInfoRowProps {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  full?: boolean;
}

/**
 * A fixed-label / value row inside {@link WorkloadInformationCard}.
 * Promoted from the Pod detail page's local `InfoRow`.
 */
export function WorkloadInfoRow({ label, children, mono, full }: WorkloadInfoRowProps) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</div>
      <div className={`mt-0.5 text-sm ${mono ? "font-mono text-xs break-all" : ""}`}>{children}</div>
    </div>
  );
}

/** Card wrapper that lays out {@link WorkloadInfoRow} children in a 2-column grid. */
export function WorkloadInformationCard({
  title = "Information",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 gap-y-3 p-4 pt-2 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}
