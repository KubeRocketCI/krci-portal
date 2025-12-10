import React from "react";

export interface SubSectionProps {
  title?: string | React.ReactElement;
  titleTooltip?: string | React.ReactElement;
  description?: string | React.ReactElement;
  enableCopyTitle?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}
