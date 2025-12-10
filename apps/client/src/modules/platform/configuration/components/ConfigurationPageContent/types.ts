import { LucideIcon } from "lucide-react";

export interface PageDescription {
  id: string;
  label: string;
  description: string;
  docLink?: string;
  icon: LucideIcon;
}

export interface ConfigurationPageContentProps {
  creationForm: {
    component: React.ReactNode;
    isOpen: boolean;
    onClose: () => void;
    onOpen: () => void;
    permission: {
      allowed: boolean;
      reason: string;
    };
    label?: string;
    isDisabled?: boolean;
  };
  children: React.ReactNode;
  pageDescription: PageDescription;
}
