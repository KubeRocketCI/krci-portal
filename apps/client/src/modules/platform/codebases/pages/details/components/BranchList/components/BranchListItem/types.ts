import { CodebaseBranch } from "@my-project/shared";
import React from "react";

export interface CodebaseBranchProps {
  codebaseBranch: CodebaseBranch;
  expandedPanel: string | null;
  id: string;
  handlePanelChange: (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
}
