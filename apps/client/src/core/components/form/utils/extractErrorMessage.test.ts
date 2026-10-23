import { describe, expect, test } from "vitest";
import { extractErrorMessage } from "./extractErrorMessage";

describe("extractErrorMessage", () => {
  test("returns undefined when there are no errors", () => {
    expect(extractErrorMessage([])).toBeUndefined();
  });

  test("returns a string error", () => {
    expect(extractErrorMessage(["Enter a name for the cluster."])).toBe("Enter a name for the cluster.");
  });

  test("returns the message of a Standard Schema issue", () => {
    const issue = { message: "Provide the cluster token.", path: ["clusterToken"] };

    expect(extractErrorMessage([issue])).toBe("Provide the cluster token.");
  });

  test("returns the first message of nested errors", () => {
    const errors = [[{ message: "Paste the cluster certificate.", path: ["clusterCertificate"] }], ["Second error"]];

    expect(extractErrorMessage(errors)).toBe("Paste the cluster certificate.");
  });

  test("returns undefined for an empty nested array", () => {
    expect(extractErrorMessage([[]])).toBeUndefined();
  });

  test("returns undefined for an object without a message", () => {
    expect(extractErrorMessage([{ code: "custom" }])).toBeUndefined();
  });
});
