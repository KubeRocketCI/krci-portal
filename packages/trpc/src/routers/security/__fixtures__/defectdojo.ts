import { DefectDojoClient, type DefectDojoClientConfig } from "../../../clients/defectdojo/index.js";

export const WEB_URL = "https://dd-web.example.com";

export function createTestClient(overrides: Partial<DefectDojoClientConfig> = {}): DefectDojoClient {
  return new DefectDojoClient({
    apiBaseURL: "https://dd.example.com",
    apiKey: "key",
    webBaseURL: WEB_URL,
    ...overrides,
  });
}
