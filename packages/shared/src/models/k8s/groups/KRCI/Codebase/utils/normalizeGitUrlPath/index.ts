import { stripLeadingSlash, stripTrailingSlash } from "../../../../../../../utils/index.js";

const GIT_SUFFIX = ".git";

// A loop rather than a `(\.git)+$` regex: the repeating group is a polynomial
// ReDoS backtracking risk on pathological input, whereas this stays linear.
function stripTrailingGitSuffixes(value: string): string {
  let result = value;
  while (result.endsWith(GIT_SUFFIX)) {
    result = result.slice(0, -GIT_SUFFIX.length);
  }
  return result;
}

/**
 * Normalizes a git repository path for comparison across Codebase resources.
 * Stored specs carry a leading slash while wizard-built candidates don't, and
 * the Tekton interceptor matches paths case-insensitively — so comparisons must
 * be slash-, case- and `.git`-suffix-insensitive. Wizard input is slash-normal,
 * but Codebases created out-of-band (e.g. raw `kubectl apply`) can carry
 * surrounding or duplicate slashes that bypass form validation, so those are
 * collapsed too before comparison.
 *
 * @example
 * normalizeGitUrlPath("/Org/Repo.git") // "org/repo"
 * normalizeGitUrlPath("org/repo")      // "org/repo"
 */
export function normalizeGitUrlPath(path: string | null | undefined): string {
  if (!path) {
    return "";
  }
  const collapsed = path.trim().toLowerCase().replace(/\/+/g, "/");
  const slashNormalized = stripLeadingSlash(stripTrailingSlash(collapsed));
  return stripTrailingGitSuffixes(slashNormalized);
}
