import { ManageSonarCIProps } from "../../types";

export type DataContextProviderValue = ManageSonarCIProps;

export type DataContextProviderProps = ManageSonarCIProps & {
  children: React.ReactNode;
};
