import { describe, expect, it } from "vitest";
import { createAgentSubstrateSource } from "./fromEnv.js";
import { GrpcAgentSubstrateSource } from "./grpc/index.js";

describe("createAgentSubstrateSource", () => {
  it.each([undefined, "", "   "])("builds no adapter when AGENT_SUBSTRATE_URL is %j", (value) => {
    expect(createAgentSubstrateSource({ AGENT_SUBSTRATE_URL: value })).toBeUndefined();
  });

  it("builds the gRPC adapter when AGENT_SUBSTRATE_URL is set", () => {
    const source = createAgentSubstrateSource({ AGENT_SUBSTRATE_URL: "https://api.ate-system.svc:443" });

    expect(source).toBeInstanceOf(GrpcAgentSubstrateSource);
  });
});
