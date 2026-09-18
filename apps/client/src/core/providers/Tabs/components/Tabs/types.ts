export interface Tab {
  id?: string;
  label: string;
  component: React.ReactNode;
  icon?: React.ReactElement;
  disabled?: boolean;
  onClick?: () => void;
  /**
   * Default: inactive content sits in a hidden `<Activity>`; state kept, effects, queries and watches paused.
   * `true`: mounted on first activation, CSS-hidden while inactive, effects keep running.
   * Use for content that owns a live session (pod shell, log stream).
   */
  persistent?: boolean;
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
