import { CodebaseBranch } from "@my-project/shared";
import React from "react";

export interface BranchListItemProps {
  codebaseBranch: CodebaseBranch;
  expandedPanel: string | null;
  id: string;
  handlePanelChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}
