# Actor to issue link comes from the actor template environment

Agent Substrate actors carry no labels or annotations, and the actor name `issue-<project-id>-<iid>` gives no project path. The portal reads these environment values of the actor template that the dispatcher writes: `PROJECT_PATH`, `PROJECT_ID`, `ISSUE_IID`, `AGENT_PROFILE`, `ANTHROPIC_MODEL`, `TURN_LIMIT`. The server passes only these to the browser; the template holds other values in clear text. The fleet passes all but `TURN_LIMIT`; the Agent detail adds `TURN_LIMIT`. The Codebase is matched by `Codebase.spec.gitUrlPath` equal to `/` + `PROJECT_PATH`. The issue link is the matched Codebase's `status.gitWebUrl` + `/-/issues/` + `ISSUE_IID`, when its GitServer is GitLab and the URL path ends with `PROJECT_PATH`; a `gitWebUrl` on the GitServer host with no port gets the GitServer `httpsPort`, which the codebase operator leaves out. The dispatcher docs list these values as read by the portal.

Beside the env values, the server passes three scheduling fields to the browser: the worker selector match labels and the CPU and memory limits of the actor template, and the worker labels (`Worker.labels`, the `metadata.labels` of the WorkerPool). Room per worker pool is counted from them. The dispatcher docs list the worker selector and the limits.

The Agent detail also passes these fields to the browser: the image of the agent container (the first container that holds the issue env values), with its digest; the preferred snapshot fidelity of the actor template; the worker assignment of the actor (worker, worker pool, worker pod, node, sandbox class); and the sandbox class of the newest snapshot of the actor.

## Consequences

- A dispatcher change to these names breaks the issue column, not the page: an actor without them shows no issue.
- A dispatcher change of `TURN_LIMIT` breaks the turn limit of the Agent detail, not the page.
- A dispatcher change of the worker selector key or of the limits changes room and the room size, not the page.
- Any new field the portal reads is added to this list and to the dispatcher docs.
