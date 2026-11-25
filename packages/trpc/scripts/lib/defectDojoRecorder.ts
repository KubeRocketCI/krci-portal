import { parseArgs } from "node:util";
import { stripTrailingSlash } from "@my-project/shared";
import { DefectDojoClient } from "../../src/clients/defectDojo/index.js";

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
