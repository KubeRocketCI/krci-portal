import type { ReactNode } from "react";
import { Card } from "@/core/components/ui/card";

interface ChartCardProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function ChartCard({ title, description, children }: ChartCardProps) {
  return (
    <Card className="flex min-w-0 flex-col gap-4 p-5">
      <div>
        <h4 className="text-foreground text-sm font-medium">{title}</h4>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      {children}
    </Card>
  );
}
