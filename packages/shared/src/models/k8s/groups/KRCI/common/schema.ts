import z from "zod";
import { k8sOperation } from "../../../core";

export const ciToolEnum = z.enum(["tekton"]);

export const gitProviderEnum = z.enum([
  "gerrit",
  "github",
  "gitlab",
  "bitbucket",
]);

export const protectedOperationsEnum = z.enum([k8sOperation.patch, k8sOperation.delete]);