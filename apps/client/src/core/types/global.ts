export type ValueOf<T> = T[keyof T];

export interface KubeObjectAction {
  name: string;
  label: string;
  disabled?: {
    status: boolean;
    reason?: string;
  };
  action: (e: React.SyntheticEvent) => void;
  Icon?: React.ReactNode;
  isTextButton?: boolean;
}
