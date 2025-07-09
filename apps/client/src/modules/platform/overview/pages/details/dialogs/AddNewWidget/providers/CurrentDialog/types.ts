import { AddNewWidgetProps } from "../../types";

export type CurrentDialogContextProviderProps = AddNewWidgetProps & {
  children: React.ReactNode;
};

export type CurrentDialogContextProviderValue = AddNewWidgetProps;
