import { DialogProps } from "@/core/providers/Dialog/types";
import { CDPipeline, CDPipelineDeploymentType } from "@my-project/shared";
import { NAMES } from "./names";
import { ApplicationRowType } from "./components/fields/Applications/types";

type ApplicationFieldArrayKey = `${typeof NAMES.APPLICATIONS_FIELD_ARRAY}.${number}.${keyof ApplicationRowType}`;

export type ManageCDPipelineFormValues = {
  [NAMES.NAME]: string;
  [NAMES.NAMESPACE]: string;
  [NAMES.DESCRIPTION]: string;
  [NAMES.DEPLOYMENT_TYPE]: CDPipelineDeploymentType;
  [NAMES.APPLICATIONS]: string[];
  [NAMES.APPLICATIONS_TO_PROMOTE]: string[];
  [NAMES.INPUT_DOCKER_STREAMS]: string[];
  [NAMES.APPLICATIONS_TO_ADD_CHOOSER]: string[];
  [NAMES.APPLICATIONS_FIELD_ARRAY]: ApplicationRowType[];
  [NAMES.APPLICATIONS_TO_PROMOTE_ALL]: string[];
} & {
  // Dynamic properties for application field array items
  [K in ApplicationFieldArrayKey]: K extends `${string}.${string}.appBranch`
    ? string
    : K extends `${string}.${string}.appName`
      ? string
      : K extends `${string}.${string}.appToPromote`
        ? boolean
        : never;
};

export type ManageCDPipelineDialogProps = DialogProps<{
  CDPipeline?: CDPipeline;
}>;
