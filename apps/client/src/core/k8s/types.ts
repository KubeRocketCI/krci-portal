import { LucideProps } from "lucide-react";

export interface k8sResourceConfig {
  apiVersion: string;
  kind: string;
  group: string;
  singularName: string;
  pluralName: string;
}

export type LucideIconComponent = React.ForwardRefExoticComponent<
  Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
>;

export interface StatusIcon {
  component: LucideIconComponent;
  color: string;
  isSpinning?: boolean;
}
