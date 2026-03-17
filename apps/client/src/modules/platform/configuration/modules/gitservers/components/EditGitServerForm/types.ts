import { GitServer } from "@my-project/shared";
export { NAMES } from "./constants";
export type { EditGitServerFormValues } from "./names";

export interface EditGitServerFormProps {
  gitServer: GitServer;
  webhookURL: string | undefined;
}
