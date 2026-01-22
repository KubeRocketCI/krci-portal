import React from "react";
import type { ManageGitOpsDataContext } from "../../types";

export const GitOpsDataContext = React.createContext<ManageGitOpsDataContext | null>(null);
