import { LucideProps } from "lucide-react";

export type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export interface K8sResourceStatusIcon {
  component: LucideIconComponent;
  color: string;
  isSpinning?: boolean;
}

export type FilterTypeWithOptionAll<FilterType> = "all" | FilterType;
