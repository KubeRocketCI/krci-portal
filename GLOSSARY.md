# KubeRocketCI Portal

The web UI of KubeRocketCI: people see and manage the platform's codebases, pipelines, deployments and the services around them.

## Language

### Agent Substrate

Terms shared with the dispatcher match `krci-agent-dispatcher/GLOSSARY.md`.

**Agent Substrate**:
The sandbox platform that runs isolated actors on a shared set of workers.
_Avoid_: Substrate cluster, sandbox service

**Agent mode**:
The portal mode that shows the Agent Substrate fleet that agents run on.
_Avoid_: agent view, substrate mode

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

**Worker labels**:
The labels of a worker pool: the `metadata.labels` of its WorkerPool, which Agent Substrate copies to each of its workers. A worker pool with no worker shows none.
_Avoid_: pool labels, node labels, tags

**Worker selector**:
The labels of an actor template that a worker must have to host an actor of that template: every key must equal the worker label of that key. No worker selector: every worker matches.
_Avoid_: node selector, pool selector, affinity

**Room size**:
Of a worker pool: the largest CPU limit and the largest memory limit over the current actor templates that can use it, those whose worker selector matches an active, registered worker of the worker pool. The two maxima can come from different templates, so the room size can be larger than any one template. None of these templates sets limits, or no current actor template at all: no room size; room counts actors only.
_Avoid_: agent size, template size, fleet room size

**Room**:
The number of actors of the room size that the active, registered workers of a worker pool can still host, runtime overhead included. No room size: the number of actors that the worker capacity still allows. Room zero: no active, registered worker can host an actor of the room size; an actor of a smaller template may still fit. A worker that no worker selector matches adds no room. Fleet room: the sum over the worker pools.
_Avoid_: headroom, free capacity, slots

**Room state**:
The state of room in a worker pool. Room: room above zero. Full: room zero; a worker would fit an actor of the room size if it hosted no actor. Too small: room zero; no worker fits one actor of the room size even when it hosts no actor. With no room size, or limited by the actor count alone, too small is "no actor capacity": the workers have an actor capacity of zero. No worker: no worker is active and registered. No template: actor templates exist and no worker selector matches a worker of the worker pool; a configuration fact, never a warning or an error, and nothing in fleet room. A worker pool with no room is a warning while another worker pool has room, and an error, "no room in the fleet", when the fleet has room zero.
_Avoid_: saturated, exhausted

**Limited by**:
The worker resources (actor count, CPU, memory) that bound room: on each active, registered worker of a worker pool, the resources whose free amount fits the fewest actors of the room size. Several when workers are bound by different resources or one worker by several. In a too small worker pool: the resources that fit no actor on a worker that hosts no actor. None when the room state is no worker or no template.
_Avoid_: bottleneck, constrained by

**Snapshot**:
The saved state of an actor; the durable snapshot is the one a resume or revert restores.
_Avoid_: checkpoint, backup, image

**Pending snapshot**:
The latest snapshot of an actor while its durable copy is still being written; a resume now restores an older snapshot.
_Avoid_: not durable snapshot, uploading snapshot

**Needs attention**:
A fleet condition an operator acts on: a crashed actor, an actor that no worker pool can host (its worker selector matches no active, registered worker while the fleet has one), a worker pool with fewer ready replicas than desired, a worker that is not active, or a pending snapshot. An error stops work now; a warning (a draining worker, a pending snapshot) can clear on its own.
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
