import { K8sResourceConfig } from "../../../common/types.js";
import { codebaseBranchStatusEnum } from "./schema.js";
import { codebaseBranchLabels } from "./labels.js";

export const k8sCodebaseBranchConfig = {
  apiVersion: "v2.edp.epam.com/v1",
  group: "v2.edp.epam.com",
  version: "v1",
  kind: "CodebaseBranch",
  singularName: "codebasebranch",
  pluralName: "codebasebranches",
  labels: codebaseBranchLabels,
} as const satisfies K8sResourceConfig<typeof codebaseBranchLabels>;

export const codebaseBranchStatus = codebaseBranchStatusEnum.enum;
