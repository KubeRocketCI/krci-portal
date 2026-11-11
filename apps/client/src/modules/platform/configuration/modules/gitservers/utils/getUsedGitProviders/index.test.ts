import { GitProvider, GitServer } from "@my-project/shared";
import { describe, expect, it } from "vitest";
import { getUsedGitProviders } from "./index";

function gs(name: string, provider: GitProvider): GitServer {
  return { metadata: { name }, spec: { gitProvider: provider } } as GitServer;
}

describe("getUsedGitProviders", () => {
  it("returns an empty set for undefined", () => {
    expect(getUsedGitProviders(undefined).size).toBe(0);
  });

  it("collects spec.gitProvider of every server", () => {
    const servers = [gs("github", "github"), gs("gitlab", "gitlab")];

    expect([...getUsedGitProviders(servers)].sort()).toEqual(["github", "gitlab"]);
  });

  it("ignores a server without spec.gitProvider", () => {
    expect(getUsedGitProviders([{ metadata: { name: "x" }, spec: {} } as GitServer]).size).toBe(0);
  });

  it("blocks a provider whose name is taken by a server of another provider", () => {
    const used = getUsedGitProviders([gs("gitlab", "github")]);

    expect(used.has("gitlab")).toBe(true);
    expect(used.has("github")).toBe(true);
  });

  it("blocks the provider of a custom-named server and ignores the name", () => {
    expect([...getUsedGitProviders([gs("my-gitlab", "gitlab")])]).toEqual(["gitlab"]);
  });
});
