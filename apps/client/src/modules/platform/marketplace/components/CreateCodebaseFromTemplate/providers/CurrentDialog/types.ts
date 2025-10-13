import { CreateCodebaseFromTemplateDialogProps } from "../../types";

export type CurrentDialogContextProviderProps = CreateCodebaseFromTemplateDialogProps & {
  children: React.ReactNode;
};

export type CurrentDialogContextProviderValue = CreateCodebaseFromTemplateDialogProps;
