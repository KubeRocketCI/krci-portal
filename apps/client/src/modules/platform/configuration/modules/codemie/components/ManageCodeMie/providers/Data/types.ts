import { ManageCodeMieProps } from "../../types";

export type DataContextProviderValue = ManageCodeMieProps;

export type DataContextProviderProps = ManageCodeMieProps & {
  children: React.ReactNode;
};
