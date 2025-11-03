/**
 * Custom error class for Kubernetes API errors
 * Preserves the HTTP status code from the Kubernetes API response
 */
export class K8sApiError extends Error {
  public readonly statusCode: number;
  public readonly statusText: string;
  public readonly responseBody: string;

  constructor(statusCode: number, statusText: string, responseBody: string) {
    super(`Kubernetes API request failed: ${statusCode} ${statusText}. ${responseBody}`);
    this.name = "K8sApiError";
    this.statusCode = statusCode;
    this.statusText = statusText;
    this.responseBody = responseBody;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, K8sApiError);
    }
  }
}
