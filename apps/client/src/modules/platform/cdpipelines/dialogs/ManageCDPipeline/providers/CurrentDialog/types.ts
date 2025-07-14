import { Codebase } from "@my-project/shared";
import { ManageCDPipelineDialogProps } from "../../types";

export interface CurrentDialogContextProviderProps extends ManageCDPipelineDialogProps {
  children: React.ReactNode;
}

export interface CurrentDialogContextProviderValue extends ManageCDPipelineDialogProps {
  extra: {
    applications: Codebase[] | undefined;
  };
}
