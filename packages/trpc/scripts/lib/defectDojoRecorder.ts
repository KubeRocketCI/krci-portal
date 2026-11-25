import { parseArgs } from "node:util";
import { stripTrailingSlash, type FindingsScope, type PlatformFindingsList } from "@my-project/shared";
import { DefectDojoClient } from "../../src/clients/defectDojo/index.js";
import type { PlatformFacts } from "../../src/routers/defectDojo/platformFindings/facts.js";
import {
  readPlatformFindings,
  type PlatformListKind,
  type PlatformListRequest,
} from "../../src/routers/defectDojo/platformFindings/list.js";
import { NAMESPACE_PRODUCT_TAG_TEXT, toFindingsScope } from "../../src/routers/defectDojo/platformFindings/scope.js";

export interface RecorderSettings {
  url: string;
  token: string;
  k8sFile: string;
}

export function readRecorderSettings(): RecorderSettings {
  const { values } = parseArgs({ options: { "k8s-file": { type: "string" } } });
  const url = stripTrailingSlash(process.env.DEFECTDOJO_URL);
  const token = process.env.DEFECTDOJO_TOKEN;
  const k8sFile = values["k8s-file"];
  if (!url || !token || !k8sFile) {
    console.error("Set DEFECTDOJO_URL and DEFECTDOJO_TOKEN and pass --k8s-file (see the header of the script).");
    process.exit(2);
  }

  return { url, token, k8sFile };
}

/** Clients for the two outage answers: no connection settings, and an address that refuses the connection. */
export function outageClients(): { notConfigured: DefectDojoClient; unreachable: DefectDojoClient } {
  return {
    notConfigured: new DefectDojoClient({ apiBaseURL: "", token: "" }),
    unreachable: new DefectDojoClient({ apiBaseURL: "http://127.0.0.1:1", token: "not-a-token", timeoutMs: 2000 }),
  };
}

export async function recordFindingsScope(source: DefectDojoClient, facts: PlatformFacts): Promise<FindingsScope> {
  return toFindingsScope(facts, await source.listProductsWithTagText(NAMESPACE_PRODUCT_TAG_TEXT));
}

function describeFindingsList(output: PlatformFindingsList): string {
  if (output.state !== "data") {
    return output.state;
  }
  return `data, ${output.findings.length} rows of ${output.total}${output.truncated ? ", truncated" : ""}`;
}

export interface RecordedList<Request = PlatformListRequest> {
  input: Request;
  output: PlatformFindingsList;
}

/** Reads one list as its procedure does and logs what it holds. */
export async function recordPlatformList<Request extends PlatformListRequest>(
  source: DefectDojoClient,
  facts: PlatformFacts,
  kind: PlatformListKind,
  name: string,
  input: Request
): Promise<RecordedList<Request>> {
  const output = await readPlatformFindings(source, facts, input, kind);
  console.log(`${name}: ${describeFindingsList(output)}`);
  return { input, output };
}
