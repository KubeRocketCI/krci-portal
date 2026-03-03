import type { ReactNode } from "react";

interface TourStepContentProps {
  title: string;
  children: ReactNode;
}

export function TourStepContent({ title, children }: TourStepContentProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {children}
    </div>
  );
}
