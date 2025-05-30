export interface TabsContextProviderValue {
  activeTab: number;
  handleChangeTab: (event: React.ChangeEvent<object> | null, newActiveTabIdx: number) => void;
}

export interface TabsContextProviderProps {
  children: React.ReactNode;
  initialTabIdx?: number;
  id: string;
  rememberLastTab?: boolean;
}
