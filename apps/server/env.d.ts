// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";

      SERVER_PORT: string;
      SERVER_SECRET: string;

      PORTAL_URL: string;

      OIDC_ISSUER_URL: string;
      OIDC_CLIENT_ID: string;
      OIDC_CLIENT_SECRET: string;
      OIDC_SCOPE: string;
      OIDC_CODE_CHALLENGE_METHOD: string;

      API_PREFIX: string;

      TEKTON_RESULTS_URL: string;

      SONAR_HOST_URL: string;
      SONAR_TOKEN: string;
      SONAR_WEB_URL?: string;

      DEPENDENCY_TRACK_URL: string;
      DEPENDENCY_TRACK_API_KEY: string;
      DEPENDENCY_TRACK_WEB_URL?: string;

      GITFUSION_URL: string;

      DEPLOY_CLIENT_DIST_DIR?: string;
    }
  }
}

export {};
