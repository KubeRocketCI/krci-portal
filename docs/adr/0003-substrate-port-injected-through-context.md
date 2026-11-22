# The Agent Substrate source is a port injected through the tRPC context

Other external clients are built inside each procedure from an env var and replaced in tests with `vi.mock`. Agent Substrate is different: the server builds one `AgentSubstrateSource` adapter at start and puts it into `TRPCContext`, as it does for `notificationsStore`. The port has two adapters: gRPC for production, memory for tests. Storybook seeds the React Query cache with `FleetSnapshot` fixtures. The fleet module owns the joins, totals and connection states; procedures only call it.

## Consequences

- With the Helm value unset, the context holds no adapter and the fleet module returns the not-configured state without a network call.
- Fleet behaviour is tested only through the procedure, with the memory adapter in the context; no module mocking. The gRPC adapter is tested against an in-process server of the generated service.
