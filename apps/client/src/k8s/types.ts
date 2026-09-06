import { LucideProps } from "lucide-react";

export type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export interface K8sResourceStatusIcon {
  component: LucideIconComponent;
  color: string;
  isSpinning?: boolean;
}

export type K8sResourceStatusDisplay = K8sResourceStatusIcon & { label: string };

export type FilterTypeWithOptionAll<FilterType> = "all" | FilterType;
