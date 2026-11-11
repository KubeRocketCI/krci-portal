import { describe, expect, it } from "vitest";
import { gitProvider, gitUser } from "@my-project/shared";
import { getDefaultGitUser } from "./index";

describe("getDefaultGitUser", () => {
  it("maps gerrit to the Gerrit CI user", () => {
    expect(getDefaultGitUser(gitProvider.gerrit)).toBe(gitUser.GERRIT);
  });

  it("maps github, gitlab and bitbucket to the git user", () => {
    expect(getDefaultGitUser(gitProvider.github)).toBe(gitUser.GITHUB);
    expect(getDefaultGitUser(gitProvider.gitlab)).toBe(gitUser.GITLAB);
    expect(getDefaultGitUser(gitProvider.bitbucket)).toBe(gitUser.BITBUCKET);
  });
});
