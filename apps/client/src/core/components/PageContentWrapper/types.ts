import { LucideIcon } from "lucide-react";
import React from "react";
import type { PinnedPage } from "@/core/hooks/usePinnedItems";
import type { Tab, TourHighlight } from "@/core/providers/Tabs/components/Tabs/types";

export interface PageContentWrapperProps {
  icon?: LucideIcon;
  title?: string | React.ReactElement;
  titleTooltip?: string | React.ReactElement;
  description?: string | React.ReactElement;
  enableCopyTitle?: boolean;
  pinConfig?: PinnedPage;
  actions?: React.ReactNode;
  extraLinks?: React.ReactNode;
  subHeader?: React.ReactNode;
  tabs?: Tab[];
  activeTab?: number;
  onTabChange?: (event: React.ChangeEvent<object>, newValue: number) => void;
  tabDataTour?: string;
  tourHighlight?: TourHighlight;
  children?: React.ReactNode;
}
