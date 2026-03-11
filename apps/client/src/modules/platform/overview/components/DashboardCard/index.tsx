import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { Card, CardContent } from "@/core/components/ui/card";

interface DashboardCardProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function DashboardCard({ title, icon: Icon, iconColor, badge, children, className }: DashboardCardProps) {
  return (
    <Card className={className ?? "border"}>
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <Icon className="size-4" style={{ color: iconColor }} />}
            <h2 className="text-foreground text-base font-medium">{title}</h2>
          </div>
          {badge}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
