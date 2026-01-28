import { GitServer } from "@my-project/shared";
export { NAMES } from "./constants";

export interface ManageGitServerProps {
  gitServer: GitServer | undefined;
  webhookURL: string | undefined;
  handleClosePanel: (() => void) | undefined;
}

export type { ManageGitServerFormValues } from "./names";
