import { describe, expect, it } from "vitest";
import { createCodebaseDraftSecretObject } from "./index.js";
import { safeEncode } from "../../../../../../../utils/index.js";

describe("K8sCodebase: createCodebaseDraftSecret", () => {
  it("should return a valid SecretDraft object", () => {
    const result = createCodebaseDraftSecretObject({
      codebaseName: "my-app",
      username: "user123",
      password: "pass123",
    });

    expect(result).toEqual({
      apiVersion: "v1",
      kind: "Secret",
      metadata: {
        name: "repository-codebase-my-app-temp",
      },
      data: {
        username: safeEncode("user123"),
        password: safeEncode("pass123"),
      },
    });
  });

  it("should correctly encode the username and password", () => {
    const username = "my-user";
    const password = "s3cr3t!";
    const result = createCodebaseDraftSecretObject({
      codebaseName: "demo",
      username: username,
      password: password,
    });

    expect(result.data?.username).toBe(safeEncode(username));
    expect(result.data?.password).toBe(safeEncode(password));
  });

  it("should generate the correct metadata.name format", () => {
    const result = createCodebaseDraftSecretObject({
      codebaseName: "sample",
      username: "a",
      password: "b",
    });

    expect(result.metadata.name).toBe("repository-codebase-sample-temp");
  });

  it("should throw or encode empty strings if input is empty", () => {
    const result = createCodebaseDraftSecretObject({
      codebaseName: "x",
      username: "",
      password: "",
    });

    expect(result.data?.username).toBe(safeEncode(""));
    expect(result.data?.password).toBe(safeEncode(""));
  });
});
