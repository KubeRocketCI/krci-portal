import type { AppRouter } from "@my-project/server";
import { createTRPCClient, splitLink, wsLink, createWSClient, httpBatchLink } from "@trpc/client";
import type { TRPCClient } from "@trpc/client";

export const trpc: TRPCClient<AppRouter> = createTRPCClient<AppRouter>({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: wsLink({
        client: createWSClient({
          url: "/api",
        }),
      }),
      false: httpBatchLink({
        url: "/api",
        headers: { credentials: "include" },
        fetch: async (url, options) => {
          // await wait(2000);

          return fetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    }),
  ],
});
