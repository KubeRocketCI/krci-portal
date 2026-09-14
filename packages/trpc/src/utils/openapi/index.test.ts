import { describe, it, expect } from "vitest";
import { generateOpenApiDocument, type OpenAPIObject } from "trpc-to-openapi";
import { BUILD_MANAGED_PARAM_NAMES } from "@my-project/shared";
import { appRouter } from "../../routers/index.js";
import { OPENAPI_DOCUMENT_OPTIONS, rewriteErrorEnvelopeSchemas } from "./index.js";

interface RewrittenSchema {
  type: string;
  required: string[];
  properties: {
    error: {
      type: string;
      required: string[];
      properties: {
        code: { example: string };
        reason: { description: string };
        message: { example: string };
      };
    };
  };
  example: { error: { code: string; message: string } };
}

type DocWithSchemas = OpenAPIObject & { components: { schemas: Record<string, unknown> } };

const makeDoc = (schemas: Record<string, unknown>): DocWithSchemas =>
  ({
    openapi: "3.1.0",
    info: { title: "test", version: "1.0.0" },
    components: { schemas },
  }) as DocWithSchemas;

describe("rewriteErrorEnvelopeSchemas", () => {
  it("rewrites every error.* schema to describe the {error: {code, reason?, message}} envelope", () => {
    const doc = makeDoc({
      "error.BAD_REQUEST": {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          issues: { type: "array" },
        },
        required: ["message", "code"],
      },
      "error.NOT_FOUND": {
        type: "object",
        properties: { message: { type: "string" }, code: { type: "string" } },
        required: ["message", "code"],
      },
    });

    rewriteErrorEnvelopeSchemas(doc);

    const bad = doc.components.schemas["error.BAD_REQUEST"] as unknown as RewrittenSchema;

    expect(bad.type).toBe("object");
    expect(bad.required).toEqual(["error"]);
    expect(bad.properties.error.type).toBe("object");
    expect(bad.properties.error.required).toEqual(["code", "message"]);
    expect(bad.properties.error.properties.code.example).toBe("BAD_REQUEST");
    expect(bad.properties.error.properties.message.example).toBe("Bad Request");
    expect(typeof bad.properties.error.properties.reason.description).toBe("string");
    // The legacy top-level `issues` field is gone after the rewrite.
    expect((bad.properties as Record<string, unknown>).issues).toBeUndefined();
    expect(bad.example.error.code).toBe("BAD_REQUEST");
    expect(bad.example.error.message).toBe("Bad Request");
  });

  it("uses the correct HTTP status phrase for each tRPC code", () => {
    const doc = makeDoc({
      "error.UNAUTHORIZED": {},
      "error.FORBIDDEN": {},
      "error.NOT_FOUND": {},
      "error.TIMEOUT": {},
      "error.CONFLICT": {},
      "error.UNPROCESSABLE_CONTENT": {},
      "error.TOO_MANY_REQUESTS": {},
      "error.INTERNAL_SERVER_ERROR": {},
    });

    rewriteErrorEnvelopeSchemas(doc);

    const phrase = (key: string) => (doc.components.schemas[key] as unknown as RewrittenSchema).example.error.message;

    expect(phrase("error.UNAUTHORIZED")).toBe("Unauthorized");
    expect(phrase("error.FORBIDDEN")).toBe("Forbidden");
    expect(phrase("error.NOT_FOUND")).toBe("Not Found");
    expect(phrase("error.TIMEOUT")).toBe("Request Timeout");
    expect(phrase("error.CONFLICT")).toBe("Conflict");
    expect(phrase("error.UNPROCESSABLE_CONTENT")).toBe("Unprocessable Entity");
    expect(phrase("error.TOO_MANY_REQUESTS")).toBe("Too Many Requests");
    expect(phrase("error.INTERNAL_SERVER_ERROR")).toBe("Internal Server Error");
  });

  it("leaves non-error.* schemas untouched", () => {
    const original = {
      type: "object",
      properties: { kind: { type: "string", enum: ["created"] } },
    };
    const doc = makeDoc({
      PipelineRunStartCreatedResponse: original,
      "error.BAD_REQUEST": {},
    });

    rewriteErrorEnvelopeSchemas(doc);

    expect(doc.components.schemas.PipelineRunStartCreatedResponse).toBe(original);
  });

  it("is a no-op when components.schemas is missing", () => {
    const doc: OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "test", version: "1.0.0" },
    };
    expect(() => rewriteErrorEnvelopeSchemas(doc)).not.toThrow();
  });

  it("delegates to tRPC's runtime mapping for unknown codes (defaults to 500)", () => {
    // tRPC's getStatusCodeFromKey returns 500 for any code not in
    // TRPC_ERROR_CODES_BY_KEY — the same fallback a real client would see if
    // a procedure threw with a custom code. Asserting this keeps the schema
    // examples in lockstep with runtime behaviour.
    const doc = makeDoc({ "error.UNKNOWN_CUSTOM_CODE": {} });
    rewriteErrorEnvelopeSchemas(doc);
    const schema = doc.components.schemas["error.UNKNOWN_CUSTOM_CODE"] as unknown as RewrittenSchema;
    expect(schema.example.error.code).toBe("UNKNOWN_CUSTOM_CODE");
    expect(schema.example.error.message).toBe("Internal Server Error");
  });
});

describe("generated document", () => {
  const generate = () => generateOpenApiDocument(appRouter, OPENAPI_DOCUMENT_OPTIONS);

  interface BuildOperation {
    security: Array<Record<string, string[]>>;
    requestBody: {
      content: Record<string, { schema: { properties: Record<string, Record<string, unknown>> } }>;
    };
  }

  const buildOperation = (doc: ReturnType<typeof generate>) =>
    doc.paths?.["/v1/pipelineruns/build"]?.post as unknown as BuildOperation;

  it("exposes the build operation behind bearerAuth", () => {
    expect(buildOperation(generate()).security).toEqual([{ bearerAuth: [] }]);
  });

  it("declares the statuses each PipelineRun procedure raises itself", () => {
    const doc = generate();
    const statuses = (path: string) => Object.keys(doc.paths?.[path]?.post?.responses ?? {});

    expect(statuses("/v1/pipelineruns/build")).toEqual(["200", "400", "401", "403", "404", "409", "500"]);
    expect(statuses("/v1/pipelineruns/start")).toEqual(["200", "400", "401", "403", "404", "500"]);
  });

  it("carries the managed param names on the build input's params schema", () => {
    const paramsSchema = buildOperation(generate()).requestBody.content["application/json"].schema.properties.params;

    expect(paramsSchema["x-krci-managed-params"]).toEqual([...BUILD_MANAGED_PARAM_NAMES]);
  });
});
