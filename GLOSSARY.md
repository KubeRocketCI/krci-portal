# KubeRocketCI Portal

The web UI of KubeRocketCI: people see and manage the platform's codebases, pipelines, deployments and the services around them.

## Language

### Agent Substrate

Terms shared with the dispatcher match `krci-agent-dispatcher/GLOSSARY.md`.

**Agent Substrate**:
The sandbox platform that runs isolated actors on a shared set of workers.
_Avoid_: Substrate cluster, sandbox service

**Fleet**:
Everything one Agent Substrate holds at one time: its atespaces, actors, workers and worker pools.
_Avoid_: cluster, inventory, estate

**Atespace**:
A named group of actors and actor templates in Agent Substrate that shares one set of access rules.
_Avoid_: namespace, tenant

**Actor**:
An isolated Agent Substrate sandbox whose state survives suspend and resume. An actor that the dispatcher made hosts one agent.
_Avoid_: agent, sandbox, container, pod

**Actor template**:
The fixed recipe an actor starts from: image, environment and size; the dispatcher makes one per issue.
_Avoid_: template (alone), profile

**Actor state**:
The lifecycle state of an actor: running, suspended, crashed, or transitional (resuming, suspending, reverting, deleting, or a state Agent Substrate does not name); unknown when the actor cannot be read.
_Avoid_: status (alone)

**Worker**:
A pre-started Agent Substrate pod that can host actors up to its capacity.
_Avoid_: runner, slot, node

**Worker pool**:
A set of workers of one size and sandbox class, kept at a desired number of replicas.
_Avoid_: pool (alone), node pool

**Room**:
The number of actors of the largest current actor template size that the active workers of a worker pool can still host, runtime overhead included. No actor template with limits: the number of actors that the worker capacity still allows. No room is room zero: an activation does not start.
_Avoid_: headroom, free capacity, slots

**Snapshot**:
The saved state of an actor; the durable snapshot is the one a resume or revert restores.
_Avoid_: checkpoint, backup, image

**Pending snapshot**:
The latest snapshot of an actor while its durable copy is still being written; a resume now restores an older snapshot.
_Avoid_: not durable snapshot, uploading snapshot

**Needs attention**:
A fleet condition an operator acts on: a crashed actor, a worker pool with fewer ready replicas than desired, a worker that is not active, or a pending snapshot. An error stops work now; a warning (a draining worker, a pending snapshot) can clear on its own.
_Avoid_: alert, issue, problem, incident

### Agents

**Dispatcher**:
The service that receives GitLab events and runs agents in actors, one atespace per dispatcher.
_Avoid_: waker, controller

**Agent**:
Claude working on one GitLab issue inside an actor. The agent follows its issue: after a stop and a re-enable, a new session runs in a new actor.
_Avoid_: actor, bot

**Issue**:
The GitLab issue an agent works on, named by project path and issue number.
_Avoid_: task, ticket, job

**Agent profile**:
The kind of agent an issue gets, such as go, python or node; the dispatcher maps each project to one.
_Avoid_: toolchain, language, image, flavour
