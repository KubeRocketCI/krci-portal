import React from "react";

export interface TabPanelProps {
  children?: React.ReactNode;
  index: string | number;
  value: string | number;
  shouldRender?: boolean;
}
