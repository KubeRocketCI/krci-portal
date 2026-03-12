import React from "react";
import { Separator } from "@/core/components/ui/separator";

interface FormSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

export const FormSection = ({ icon, title, children }: FormSectionProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground [&>svg]:size-4">{icon}</span>
          <h6 className="text-sm font-medium">{title}</h6>
        </div>
        <Separator />
      </div>
      <div>{children}</div>
    </div>
  );
};
