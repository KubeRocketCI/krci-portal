// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";

      SERVER_PORT: string;
      SERVER_SECRET: string;

      PORTAL_URL: string;

      // Optional: when unset, the portal runs in SA-token-only mode (no OIDC).
      OIDC_ISSUER_URL?: string;
      OIDC_CLIENT_ID?: string;
      OIDC_CLIENT_SECRET?: string;
      OIDC_SCOPE?: string;
      OIDC_CODE_CHALLENGE_METHOD?: string;

      API_PREFIX: string;

      TEKTON_RESULTS_URL: string;

      SONAR_HOST_URL: string;
      SONAR_TOKEN: string;
      SONAR_WEB_URL?: string;

      DEPENDENCY_TRACK_URL: string;
      DEPENDENCY_TRACK_API_KEY: string;
      DEPENDENCY_TRACK_WEB_URL?: string;

      // DefectDojo read path. Optional: without both the URL and the token the portal reports DefectDojo as "not configured".
      DEFECTDOJO_URL?: string;
      DEFECTDOJO_TOKEN?: string;
      // Base of the links to the DefectDojo web UI. Defaults to DEFECTDOJO_URL.
      DEFECTDOJO_WEB_URL?: string;
      // Name of the DefectDojo Product Type the portal reads. Defaults to "KubeRocketCI".
      DEFECTDOJO_PRODUCT_TYPE?: string;

      GITFUSION_URL: string;

      KRCI_AUDIT_URL: string;

      // Comma-separated Keycloak group name(s) bound to the "administrator" role
      // (see packages/shared/src/models/role). Optional; defaults to "administrator".
      PORTAL_ADMIN_GROUPS?: string;

      DEPLOY_CLIENT_DIST_DIR?: string;

      // Agent Substrate gRPC API, https:// only. Optional: when unset, Agent mode reports "not configured".
      AGENT_SUBSTRATE_URL?: string;

      // Shared secret for POST /rest/v1/internal/events (Argo Events Sensor).
      // Optional: when unset the route responds 503. Read ad-hoc, not part of
      // validateRequiredEnv — same pattern as PROMETHEUS_URL.
      INTERNAL_EVENTS_TOKEN?: string;
    }
  }
}

export {};
