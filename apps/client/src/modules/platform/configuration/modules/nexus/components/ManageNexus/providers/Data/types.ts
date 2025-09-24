import { ManageNexusCIProps } from "../../types";

export type DataContextProviderValue = ManageNexusCIProps;

export type DataContextProviderProps = ManageNexusCIProps & {
  children: React.ReactNode;
};
