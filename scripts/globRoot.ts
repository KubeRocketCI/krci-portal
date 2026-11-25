const GLOB_SYNTAX = /[\\*?[\]{}()!+@^$|]/g;

/**
 * `dir` as a literal picomatch prefix: forward slashes, glob syntax escaped with a backslash.
 * On win32 a backslash is a separator; elsewhere it is part of a name.
 */
export function globRootOf(dir: string, platform: NodeJS.Platform = process.platform): string {
  const posixDir = platform === "win32" ? dir.replaceAll("\\", "/") : dir;
  return posixDir.replace(GLOB_SYNTAX, "\\$&");
}
