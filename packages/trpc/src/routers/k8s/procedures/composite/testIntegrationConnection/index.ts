import { z } from "zod";
import { protectedProcedure } from "../../../../../procedures/protected/index.js";

const testIntegrationConnectionInputSchema = z.object({
  serviceType: z.enum(["argocd", "sonar", "nexus", "jira", "defectdojo", "dependencyTrack"]),
  url: z.string().url(),
  token: z.string().min(1),
});

type ServiceType = z.infer<typeof testIntegrationConnectionInputSchema>["serviceType"];

const SERVICE_CONFIG: Record<
  ServiceType,
  {
    path: string;
    authHeader: (token: string) => string;
    headerName?: string;
    isSuccess?: (response: Response) => boolean;
  }
> = {
  argocd: {
    path: "/api/v1/clusters",
    authHeader: (token) => `Bearer ${token}`,
    // 403 means token was accepted but lacks permission — still proves the token is valid
    isSuccess: (response) => response.ok || response.status === 403,
  },
  sonar: {
    path: "/api/authentication/validate",
    authHeader: (token) => `Bearer ${token}`,
  },
  nexus: {
    path: "/service/rest/v1/repositories",
    authHeader: (token) => `Basic ${token}`,
  },
  jira: {
    path: "/rest/api/2/myself",
    authHeader: (token) => `Basic ${token}`,
  },
  defectdojo: {
    path: "/api/v2/",
    authHeader: (token) => `Token ${token}`,
  },
  dependencyTrack: {
    path: "/api/v1/project",
    authHeader: (token) => token,
    headerName: "X-Api-Key",
  },
};

export const k8sTestIntegrationConnectionProcedure = protectedProcedure
  .input(testIntegrationConnectionInputSchema)
  .mutation(async ({ input }) => {
    const { serviceType, url, token } = input;
    const config = SERVICE_CONFIG[serviceType];

    // Remove trailing slashes without regex to avoid potential ReDoS
    let baseUrl = url;
    while (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, -1);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const headers: HeadersInit = {};
      const authValue = config.authHeader(token);
      const headerName = config.headerName ?? "Authorization";
      headers[headerName] = authValue;

      const response = await fetch(`${baseUrl}${config.path}`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });

      const isSuccess = config.isSuccess ? config.isSuccess(response) : response.ok;

      if (isSuccess) {
        return { success: true as const };
      }

      if (response.status === 401 || response.status === 403) {
        return {
          success: false as const,
          error: "UNAUTHORIZED" as const,
          statusCode: response.status,
          message: `Authentication failed (${response.status})`,
        };
      }

      return {
        success: false as const,
        error: "HTTP_ERROR" as const,
        statusCode: response.status,
        message: `Request failed with status ${response.status}`,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false as const,
          error: "TIMEOUT" as const,
          message: "Connection timed out after 10 seconds",
        };
      }

      // Provide detailed network error messages
      let errorMessage = "Unknown network error";
      if (error instanceof Error) {
        // Extract the underlying error from fetch's cause property
        const cause = "cause" in error ? error.cause : undefined;
        const rootError = cause instanceof Error ? cause.message : error.message;
        errorMessage = rootError;

        // Add helpful context for common errors
        if (errorMessage.includes("ENOTFOUND") || errorMessage.includes("getaddrinfo")) {
          errorMessage = `DNS resolution failed: ${errorMessage}. Check if the service name and namespace are correct.`;
        } else if (errorMessage.includes("ECONNREFUSED")) {
          errorMessage = `Connection refused: ${errorMessage}. The service may not be running or the port may be incorrect.`;
        } else if (errorMessage.includes("ETIMEDOUT")) {
          errorMessage = `Connection timed out: ${errorMessage}. The service may be unreachable due to network policies.`;
        } else if (errorMessage === "fetch failed") {
          // If still generic, include both error and cause for debugging
          errorMessage =
            cause instanceof Error
              ? `Network error: ${cause.message}`
              : `Network error: ${error.message}. Check if the URL is accessible from the cluster.`;
        }
      }

      return {
        success: false as const,
        error: "NETWORK" as const,
        message: errorMessage,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  });
