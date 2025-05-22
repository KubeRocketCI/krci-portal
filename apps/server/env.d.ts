// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "production" | "test";

      SERVER_PORT: number;
      SERVER_SECRET: string;

      LOCAL_CLIENT_ORIGIN: string;

      OIDC_ISSUER_URL: string;
      OIDC_CLIENT_ID: string;
      OIDC_CLIENT_SECRET: string;
      OIDC_SCOPE: string;
      OIDC_CODE_CHALLENGE_METHOD: string;

      SHARED_APP_API_PREFIX: string;
    }
  }
}

export {};
