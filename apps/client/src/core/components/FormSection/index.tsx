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
    <Card className="border-input border bg-transparent p-3">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-blue-600" />
        <h5 className="text-foreground text-sm font-medium">{title}</h5>
        {headerExtra}
      </div>
      {children}
    </Card>
  );
}
