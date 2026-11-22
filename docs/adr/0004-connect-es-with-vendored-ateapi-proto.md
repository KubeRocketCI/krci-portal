# Connect-ES with generated code from a vendored ateapi.proto

The gRPC adapter uses `@connectrpc/connect-node` and `@bufbuild/protobuf`. The TypeScript is generated from a copy of Agent Substrate `api/ateapi/v1/ateapi.proto` at tag `v1.0.1` and committed. A Substrate upgrade replaces the copy and regenerates.

## Considered options

- `@grpc/grpc-js` with `@grpc/proto-loader`: loads the proto at runtime, so the API has no types. Rejected.
