import { CodebaseBranchDraft } from "@my-project/shared";
import React from "react";

export interface DialogHeaderProps {
  setEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditorData: React.Dispatch<React.SetStateAction<CodebaseBranchDraft>>;
}
