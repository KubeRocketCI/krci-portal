import { CodebaseVersioning, codebaseVersioning } from "../models/index.js";

export const isKRCIVersioning = (versioningType: CodebaseVersioning | undefined) =>
  versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver;
