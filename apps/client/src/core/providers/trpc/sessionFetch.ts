/** `fetch` with the session cookie attached. A bare 401 with no tRPC envelope (a proxy or edge reply) reports session expiry. The body is never read. */
export const createSessionFetch =
  ({ onAuthError }: { onAuthError: () => void }) =>
  async (url: RequestInfo | URL, options?: RequestInit): Promise<Response> => {
    const response = await fetch(url, { ...options, credentials: "include" });

    if (response.status === 401) {
      onAuthError();
    }

    return response;
  };
