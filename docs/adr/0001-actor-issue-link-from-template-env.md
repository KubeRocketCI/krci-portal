# Actor to issue link comes from the actor template environment

Agent Substrate actors carry no labels or annotations, and the actor name `issue-<project-id>-<iid>` gives no project path. The portal reads five environment values of the actor template that the dispatcher writes: `PROJECT_PATH`, `PROJECT_ID`, `ISSUE_IID`, `AGENT_PROFILE`, `ANTHROPIC_MODEL`. The server passes only these five to the browser; the template holds other values in clear text. The Codebase is matched by `Codebase.spec.gitUrlPath` equal to `/` + `PROJECT_PATH`. The issue link is the matched Codebase's `status.gitWebUrl` + `/-/issues/` + `ISSUE_IID`, when its GitServer is GitLab and the URL path ends with `PROJECT_PATH`; a `gitWebUrl` on the GitServer host with no port gets the GitServer `httpsPort`, which the codebase operator leaves out. The dispatcher docs list these five values as read by the portal.

## Consequences

- A dispatcher change to these names breaks the issue column, not the page: an actor without them shows no issue.
- Any new field the portal reads is added to this list and to the dispatcher docs.
