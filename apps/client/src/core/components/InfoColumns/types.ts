import React from "react";

export interface InfoColumn {
  label: string;
  text: string | React.ReactElement | React.ReactNode;
  icon?: string | React.ReactElement;
  columnXs?: number;
}

export type InfoRow = InfoColumn[];

export interface GridItem {
  label: string;
  content: React.ReactNode;
  colSpan?: number;
}

export interface InfoColumnsProps {
  infoRows?: InfoRow[];
  gridItems?: GridItem[];
  className?: string;
  gridCols?: number;
}
