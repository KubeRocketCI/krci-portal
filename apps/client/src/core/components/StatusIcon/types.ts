import React from "react";
import { LucideIconComponent } from "../../../k8s/types";

export interface StatusIconProps {
  Title?: string | React.ReactElement;
  Icon: LucideIconComponent;
  color: string;
  isSpinning?: boolean;
  width?: number;
}
