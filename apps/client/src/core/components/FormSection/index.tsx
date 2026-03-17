import React from "react";
import { Card } from "@/core/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface FormSectionProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
}

export function FormSection({ icon: Icon, title, children, headerExtra }: FormSectionProps) {
  return (
    <Card className="bg-transparent shadow-none">
      <div className="mb-6 flex items-center gap-1">
        <Icon className="h-3 w-3" />
        <h5 className="text-foreground text-xs font-semibold">{title}</h5>
        {headerExtra}
      </div>
      {children}
    </Card>
  );
}
