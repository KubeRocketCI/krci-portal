import type { AppRouter } from "@my-project/server";
import type { TRPCClient } from "@trpc/client";
import { createTRPCClient, createWSClient, httpBatchLink, splitLink, wsLink } from "@trpc/client";
import { router } from "../router";

const customFetch = async (url: URL | RequestInfo, options: RequestInit) => {
  const res = await fetch(url, options);

  if (res.status === 401) {
    const { pathname } = router.state.location;

    console.log("pathname", pathname);
  }

  return res;
};

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

          return customFetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    }),
  ],
});
