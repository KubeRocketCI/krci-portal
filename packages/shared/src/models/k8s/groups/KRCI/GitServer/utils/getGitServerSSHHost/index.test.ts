import { describe, expect, it } from "vitest";
import { getGitServerSSHHost } from "./index.js";

describe("getGitServerSSHHost", () => {
  it.each([
    { gitProvider: "bitbucket", gitHost: "bitbucket.org", expected: "ssh.bitbucket.org" },
    { gitProvider: "bitbucket", gitHost: "BitBucket.org", expected: "ssh.bitbucket.org" },
    { gitProvider: "bitbucket", gitHost: "ssh.bitbucket.org", expected: "ssh.bitbucket.org" },
    { gitProvider: "bitbucket", gitHost: "bitbucket.example.com", expected: "bitbucket.example.com" },
    { gitProvider: "github", gitHost: "bitbucket.org", expected: "bitbucket.org" },
    { gitProvider: "gitlab", gitHost: "gitlab.com", expected: "gitlab.com" },
  ])("maps $gitProvider/$gitHost to $expected", ({ gitProvider, gitHost, expected }) => {
    expect(getGitServerSSHHost({ gitProvider, gitHost })).toBe(expected);
  });
});
