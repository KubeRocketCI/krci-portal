import { stripLeadingSlash } from "../../../../../../../utils/index.js";

/**
 * Normalizes a git repository path for comparison across Codebase resources.
 * Stored specs carry a leading slash while wizard-built candidates don't, and
 * the Tekton interceptor matches paths case-insensitively — so comparisons must
 * be slash-, case- and `.git`-suffix-insensitive.
 *
 * @example
 * normalizeGitUrlPath("/Org/Repo.git") // "org/repo"
 * normalizeGitUrlPath("org/repo")      // "org/repo"
 */
export const normalizeGitUrlPath = (path: string | null | undefined): string =>
  stripLeadingSlash(
    path
      ?.trim()
      .toLowerCase()
      .replace(/(\.git)+$/, "")
  );
