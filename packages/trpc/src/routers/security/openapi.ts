/** Statuses the security procedures raise, as documented on their REST routes. */
export const SECURITY_ERROR_RESPONSES = {
  400: "Invalid query parameter",
  401: "Not authenticated",
  403: "The caller may not read the Codebase or Stage",
  404: "Codebase or Stage not found",
  412: "DEFAULT_CLUSTER_NAMESPACE is not configured",
  500: "Internal server error",
  502: "DefectDojo returned an error response; REST error envelope with code BAD_GATEWAY",
  503: "DefectDojo integration not configured, or DefectDojo unreachable; REST error envelope with code SERVICE_UNAVAILABLE",
  504: "DefectDojo request timed out; REST error envelope with code GATEWAY_TIMEOUT",
};
