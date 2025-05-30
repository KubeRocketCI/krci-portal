import { k8sOperation } from "../../../core";
import { ciToolEnum, gitProviderEnum, protectedOperationsEnum } from "./schema";

export const commonLabels = {
  editProtection: "app.edp.epam.com/edit-protection",
};

export const ciTool = ciToolEnum.enum;
export const gitProvider = gitProviderEnum.enum;

export const protectedOperations = protectedOperationsEnum.enum;
