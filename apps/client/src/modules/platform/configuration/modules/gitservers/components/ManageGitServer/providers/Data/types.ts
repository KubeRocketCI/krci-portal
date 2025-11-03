import { GitServer, Secret } from "@my-project/shared";

export interface DataContextProviderValue {
  gitServer: GitServer | undefined;
  gitServerSecret: Secret | undefined;
  handleClosePanel: (() => void) | undefined;
}

export interface DataContextProviderProps {
  gitServer: GitServer | undefined;
  gitServerSecret: Secret | undefined;
  handleClosePanel: (() => void) | undefined;
  children: React.ReactNode;
}
