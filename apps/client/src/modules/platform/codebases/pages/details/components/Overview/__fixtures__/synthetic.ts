// SYNTHETIC data: derived from the recording of the testbed (test-go-app), not recorded from it. Only for a phrase the
// testbed does not hold.
import { codebaseSecurityLineSchema } from "@my-project/shared";
import { recorded, type Answer } from "./seed";

const TEST_GO_APP = recorded("test-go-app");

function levelsOf({ input, line }: Answer) {
  if (line.state !== "data") {
    throw new Error(`The recording of ${input.name} has no data`);
  }
  return line.levels;
}

/**
 * Runtime names two Critical exposed secrets in demo / prod, a phrase the recording lacks: there the vulnerabilities
 * of demo / dev outrank its exposed secrets.
 */
export const syntheticExposedSecrets: Answer = {
  input: TEST_GO_APP.input,
  line: codebaseSecurityLineSchema.parse({
    state: "data",
    levels: {
      ...levelsOf(TEST_GO_APP),
      runtime: {
        state: "data",
        severity: "Critical",
        count: 2,
        reportKind: "exposedsecretreport",
        environment: { cdPipeline: "demo", stage: "prod" },
      },
    },
  }),
};
