import { GitServer } from "@my-project/shared";

export interface ManageGitServerProps {
  gitServer: GitServer | undefined;
  webhookURL: string | undefined;
  handleClosePanel: (() => void) | undefined;
}
