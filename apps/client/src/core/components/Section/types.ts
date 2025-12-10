import { LucideIcon } from "lucide-react";
import React from "react";

export interface SectionProps {
  icon: LucideIcon;
  title?: string | React.ReactElement;
  titleTooltip?: string | React.ReactElement;
  description?: string | React.ReactElement;
  enableCopyTitle?: boolean;
  actions?: React.ReactNode;
  extraContent?: React.ReactNode;
  children: React.ReactNode;
}
