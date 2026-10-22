import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Fastify, { type FastifyInstance } from "fastify";
import { TRPCError } from "@trpc/server";
import { createRegisterOpenApiOptions } from "./__fixtures__/registerOpenApiOptions.js";

const stubCaller = vi.hoisted(() => ({
  tektonResults: {
    getTaskRunRecords: vi.fn(),
    getCustomRunRecords: vi.fn(),
  },
}));

vi.mock("@my-project/trpc", async (importActual) => {
  const actual = await importActual<typeof import("@my-project/trpc")>();
  return {
    ...actual,
    createContext: vi.fn().mockReturnValue({}),
    createCaller: vi.fn().mockReturnValue(stubCaller),
  };
});

import { registerOpenApi } from "./openapi.js";

const NAMESPACE = "krci";
const RESULT_UID = "6c1f2b8e-3d4a-4f5b-9c6d-7e8f9a0b1c2d";

const RECORD_ROUTES = [
  {
    segment: "task-runs",
    procedure: "getTaskRunRecords",
    output: { taskRuns: [] },
  },
  {
    segment: "custom-runs",
    procedure: "getCustomRunRecords",
    output: { customRuns: [] },
  },
] as const;

describe("GET /rest/v1/pipeline-runs/:resultUid/{task-runs,custom-runs}", () => {
  let app: FastifyInstance;

  const getRecords = (segment: string) =>
    app.inject({
      method: "GET",
      url: `/rest/v1/pipeline-runs/${RESULT_UID}/${segment}?namespace=${NAMESPACE}`,
    });

  beforeEach(async () => {
    vi.clearAllMocks();
    app = Fastify({ logger: false });
    registerOpenApi(app, createRegisterOpenApiOptions());
    await app.ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it.each(RECORD_ROUTES)(
    "$segment forwards namespace and resultUid to tektonResults.$procedure",
    async ({ segment, procedure, output }) => {
      stubCaller.tektonResults[procedure].mockResolvedValue(output);

      const res = await getRecords(segment);

      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual(output);
      expect(stubCaller.tektonResults[procedure]).toHaveBeenCalledWith({
        namespace: NAMESPACE,
        resultUid: RESULT_UID,
      });
    }
  );

  it.each(RECORD_ROUTES)(
    "$segment answers a procedure error with the REST envelope only",
    async ({ segment, procedure }) => {
      stubCaller.tektonResults[procedure].mockRejectedValue(
        new TRPCError({
          code: "NOT_FOUND",
          message: `result ${RESULT_UID} not found`,
        })
      );

      const res = await getRecords(segment);

      expect(res.statusCode).toBe(404);
      expect(res.json()).toEqual({
        error: { code: "NOT_FOUND", message: "Not Found" },
      });
    }
  );
});
