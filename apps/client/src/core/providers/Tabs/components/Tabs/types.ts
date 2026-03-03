export interface Tab {
  id?: string;
  label: string;
  component: React.ReactNode;
  icon?: React.ReactElement;
  disabled?: boolean;
  onClick?: () => void;
}

export interface TourHighlight {
  isNavigating: boolean;
  focusedTabId: string | null;
}

export interface TabsProps {
  tabs: Tab[];
  activeTabIdx: number;
  handleChangeTab: (event: React.ChangeEvent<object>, newActiveTabIdx: number) => void;
  dataTour?: string;
  tourHighlight?: TourHighlight;
}
