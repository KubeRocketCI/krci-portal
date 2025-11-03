import { CodebaseVersioning, codebaseVersioning } from "../models";

export const checkForKRCIVersioning = (versioningType: CodebaseVersioning | undefined) =>
  versioningType === codebaseVersioning.edp || versioningType === codebaseVersioning.semver;
