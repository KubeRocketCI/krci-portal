import type { RequestError } from "@/core/types/global";

interface K8sStatus {
  message?: string;
  details?: {
    causes?: Array<{ message?: string }>;
  };
}

/**
 * Extracts a user-friendly error message from a Kubernetes API error.
 * Parses the Status object from the error response to extract the actual error message.
 */
export const getK8sErrorMessage = (error: RequestError | null | undefined): string => {
  if (!error) {
    return "An error occurred. Please try again.";
  }

  // Try to get the responseBody from the error's cause or data
  let responseBody: string | undefined;

  // Check if error has cause with responseBody (from K8sApiError)
  if (error.cause && typeof error.cause === "object" && "responseBody" in error.cause) {
    responseBody = error.cause.responseBody as string;
  }

  // If not found, try to extract from the error message itself
  // The error message format is: "Kubernetes API request failed: {statusCode} {statusText}. {responseBody}"
  if (!responseBody && error.message) {
    // Match pattern: "Kubernetes API request failed: {statusCode} {statusText}. {json}"
    // Look for the JSON object starting after ". {" (dot space opening brace)
    const jsonStartIndex = error.message.indexOf(". {");
    if (jsonStartIndex !== -1) {
      const jsonString = error.message.substring(jsonStartIndex + 2); // +2 to skip ". "
      responseBody = jsonString;
    }
  }

  // Try to parse the responseBody as JSON (K8s Status object)
  if (responseBody) {
    try {
      const status = JSON.parse(responseBody) as K8sStatus;

      // First, try to get the main message
      if (status.message) {
        return status.message;
      }

      // If no main message, try to get from details.causes
      if (status.details?.causes?.[0]?.message) {
        return status.details.causes[0].message;
      }
    } catch {
      // If parsing fails, continue to fallback
    }
  }

  // Fallback to the original error message
  return error.message || "An error occurred while creating the codebase branch. Please try again.";
};
