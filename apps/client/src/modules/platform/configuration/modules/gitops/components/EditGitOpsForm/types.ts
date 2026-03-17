import type { Codebase } from "@my-project/shared";

export interface EditGitOpsFormProps {
  codebase: Codebase;
  onClose: () => void;
}

export type EditGitOpsFormValues = {
  gitServer: string;
  gitRepoPath: string;
  name: string;
};
