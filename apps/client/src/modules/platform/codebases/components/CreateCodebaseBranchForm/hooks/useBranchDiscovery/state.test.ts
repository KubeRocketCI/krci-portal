import { describe, expect, it } from "vitest";
import { GitServer } from "@my-project/shared";
import { getBranchDiscoveryState } from "./state";

const server = (gitProvider: string) => ({ spec: { gitProvider } }) as GitServer;
const base = { gitServerName: "github", owner: "org", repoName: "repo", isGitServerLoading: false };

describe("getBranchDiscoveryState", () => {
  it("enables discovery for a loaded non-Gerrit server", () => {
    expect(getBranchDiscoveryState({ ...base, gitServer: server("github") })).toEqual({
      isGerrit: false,
      isEnabled: true,
      isGitServerPending: false,
      isGitServerUnavailable: false,
    });
  });

  it("disables discovery for Gerrit", () => {
    const state = getBranchDiscoveryState({ ...base, gitServer: server("gerrit") });

    expect(state.isGerrit).toBe(true);
    expect(state.isEnabled).toBe(false);
  });

  it("reports pending while the server loads", () => {
    const state = getBranchDiscoveryState({ ...base, gitServer: undefined, isGitServerLoading: true });

    expect(state).toMatchObject({ isEnabled: false, isGitServerPending: true, isGitServerUnavailable: false });
  });

  it("reports unavailable when the server failed to load or does not exist", () => {
    const state = getBranchDiscoveryState({ ...base, gitServer: undefined });

    expect(state).toMatchObject({ isEnabled: false, isGitServerPending: false, isGitServerUnavailable: true });
  });

  it("stays idle without repository coordinates", () => {
    const state = getBranchDiscoveryState({ ...base, owner: "", gitServer: undefined, isGitServerLoading: true });

    expect(state).toMatchObject({ isEnabled: false, isGitServerPending: false, isGitServerUnavailable: false });
  });
});
