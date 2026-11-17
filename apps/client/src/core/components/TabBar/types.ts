import type { Tab, TourHighlight } from "@/core/providers/Tabs/components/Tabs/types";

export interface TabBarProps {
  tabs: Tab[];
  activeIndex: number;
  /** Called after the tab's own `onClick`. */
  onChange: (index: number) => void;
  dataTour?: string;
  tourHighlight?: TourHighlight;
}
