import { CodebaseVersioning, codebaseVersioning } from "../models/index.js";

export const checkForKRCIVersioning = (versioningType: CodebaseVersioning | undefined) =>
  versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver;
