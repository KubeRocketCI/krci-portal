export const getMajorMinorPatchOfVersion = (
  version: string
): {
  major: number;
  minor: number;
  patch: number;
} => {
  const [major, minor, patch] = version.split(".").map((el) => +el);

  return { major, minor, patch };
};

export const createVersioningString = (version: string, postfix: string): string =>
  !postfix ? version : `${version}-${postfix}`;

export const getVersionAndPostfixFromVersioningString = (
  versioning: string
): {
  version: string;
  postfix: string;
} => {
  const [version, postfix] = versioning.split("-");

  return { version, postfix };
};

export const createReleaseNameString = (major: number, minor: number): string => `release/${major}.${minor}`;
