import z from "zod";
import { k8sOperation } from "../../../common/index.js";
import { krciCommonLabels } from "./labels.js";

export const ciToolEnum = z.enum(["tekton", "gitlab"]);

export const krciConfigMapNamesEnum = z.enum(["edp-config", "krci-config"]);

export const gitProviderEnum = z.enum(["gerrit", "github", "gitlab", "bitbucket"]);

export const monitoringProviderEnum = z.enum(["grafana", "datadog"]);

export const protectedOperationsEnum = z.enum([k8sOperation.patch, k8sOperation.delete]);

export const krciCommonLabelsSchema = z.object({
  [krciCommonLabels.editProtection]: z.string().optional(),
});
