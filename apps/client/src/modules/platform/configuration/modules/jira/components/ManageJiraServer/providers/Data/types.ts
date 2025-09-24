import { ManageJiraServerCIProps } from "../../types";

export type DataContextProviderValue = ManageJiraServerCIProps;

export type DataContextProviderProps = ManageJiraServerCIProps & {
  children: React.ReactNode;
};
