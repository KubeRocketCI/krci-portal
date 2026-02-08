import { LucideIcon } from "lucide-react";
import React from "react";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";

export interface SectionProps {
  icon: LucideIcon;
  title?: string | React.ReactElement;
  titleTooltip?: string | React.ReactElement;
  description?: string | React.ReactElement;
  enableCopyTitle?: boolean;
  pinConfig?: PinnedPage;
  actions?: React.ReactNode;
  extraContent?: React.ReactNode;
  children: React.ReactNode;
}
