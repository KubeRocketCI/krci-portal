import { ManageArgoCDCIProps } from "../../types";

export type DataContextProviderValue = ManageArgoCDCIProps;

export type DataContextProviderProps = ManageArgoCDCIProps & {
  children: React.ReactNode;
};
