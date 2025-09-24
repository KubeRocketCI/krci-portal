import { ManageRegistryProps } from "../../types";

export type DataContextProviderValue = ManageRegistryProps;

export type DataContextProviderProps = ManageRegistryProps & {
  children: React.ReactNode;
};
