import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import {
  AuthCallbackLoginInput,
  AuthCallbackLoginOutput,
  AuthContext,
  AuthLoginOutput,
  AuthLoginWithTokenOutput,
  AuthLoginWithSATokenOutput,
  AuthLogoutOutput,
  LoginMutationInput,
  LoginWithTokenMutationInput,
  LoginWithSATokenMutationInput,
} from "./context";
import { trpcHttpClient } from "@/core/providers/trpc/http-client";
import { LoadingProgressBar } from "@/core/components/ui/LoadingProgressBar";
import { router } from "@/core/router";
import { routeHome } from "@/modules/home/pages/home/route";
import { routeAuthCallback } from "../pages/callback/route";
import { routeAuthLogin } from "../pages/login/route";

export const authInProgressKey = "authInProgress";
export const authLogoutInProgressKey = "authLogoutInProgress";

const getLoginCallbackPath = (redirectSearchParam?: string) =>
  `${routeAuthCallback.fullPath}?redirect=${redirectSearchParam || routeHome.fullPath}`;

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient();
  const trpc = trpcHttpClient;

  const meQuery = useQuery({
    queryKey: ["auth.me"],
    queryFn: () => trpc.auth.me.query(),
    enabled: !window.location.href.includes(routeAuthCallback.fullPath), // Login process goes through /login and /auth/callback pages
    retry: false,
    refetchOnWindowFocus: true, // Ensure that user's session is still valid on page focus
    refetchOnReconnect: true, // Refetch if the app regains connection,
    refetchInterval: 60 * 1000, // Refetch every 1 minute to keep token fresh
    staleTime: Infinity, // Never consider the data stale - auth state should persist
    gcTime: Infinity, // Never garbage collect the data
  });

  const isAuthenticated = meQuery.isFetched && !!meQuery.data;

  const oidcConfigQuery = useQuery({
    queryKey: ["config.oidc"],
    queryFn: () => trpc.config.oidc.query(),
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });
  // Default to true so the OIDC "Sign In" button isn't briefly hidden while the
  // config loads in OIDC-enabled deployments. Set to false only once the server
  // confirms OIDC is not configured (SA-only mode).
  const oidcEnabled = oidcConfigQuery.data?.oidcEnabled ?? true;

  // Shared success handler for the token-based logins (direct token + SA token):
  // cache the resolved user, then navigate to the post-login redirect.
  const handleTokenLoginSuccess = useCallback(
    ({ success, userInfo, clientSearch }: AuthLoginWithTokenOutput) => {
      if (success && userInfo) {
        queryClient.setQueryData(["auth.me"], userInfo);

        const redirect = new URLSearchParams(clientSearch || "").get("redirect") || routeHome.fullPath;

        router.navigate({ to: redirect, replace: true });
      }
    },
    [queryClient]
  );

  const loginMutation = useMutation<AuthLoginOutput, Error, LoginMutationInput>({
    mutationKey: ["auth.login"],
    mutationFn: ({ redirectSearchParam }) => {
      return trpc.auth.login.mutate(getLoginCallbackPath(redirectSearchParam));
    },
    onSuccess: ({ authUrl }) => {
      queryClient.setQueryData([authInProgressKey], true);
      location.href = authUrl;
    },
    onError: () => {
      queryClient.setQueryData([authInProgressKey], false);
    },
  });

  const loginCallbackMutation = useMutation<AuthCallbackLoginOutput, Error, AuthCallbackLoginInput>({
    mutationKey: ["auth.loginCallback"],
    mutationFn: (locationWithSearchParams) => {
      queryClient.setQueryData([authInProgressKey], true);
      return trpc.auth.loginCallback.mutate(locationWithSearchParams);
    },
    onSuccess: ({ success, userInfo, clientSearch }) => {
      if (success) {
        queryClient.setQueryData(["auth.me"], userInfo);

        const clientSearchParams = new URLSearchParams(clientSearch);
        const redirect = clientSearchParams.get("redirect") || routeHome.fullPath;

        router.navigate({ to: redirect, replace: true });
        queryClient.setQueryData([authInProgressKey], false);
      }
    },
    onError: () => {
      router.navigate({ to: routeAuthLogin.fullPath, replace: true });
      queryClient.setQueryData([authInProgressKey], false);
    },
  });

  const loginWithTokenMutation = useMutation<AuthLoginWithTokenOutput, Error, LoginWithTokenMutationInput>({
    mutationKey: ["auth.loginWithToken"],
    mutationFn: ({ token, redirectSearchParam }) => {
      return trpc.auth.loginWithToken.mutate({
        token,
        redirectSearchParam,
      });
    },
    onSuccess: handleTokenLoginSuccess,
    onError: () => {
      // Error handled in component
    },
  });

  const loginWithServiceAccountTokenMutation = useMutation<
    AuthLoginWithSATokenOutput,
    Error,
    LoginWithSATokenMutationInput
  >({
    mutationKey: ["auth.loginWithServiceAccountToken"],
    mutationFn: ({ token, redirectSearchParam }) => {
      return trpc.auth.loginWithServiceAccountToken.mutate({
        token,
        redirectSearchParam,
      });
    },
    onSuccess: handleTokenLoginSuccess,
    onError: () => {
      // Error handled in component
    },
  });

  const logoutMutation = useMutation<AuthLogoutOutput, Error, void>({
    mutationKey: ["auth.logout"],
    mutationFn: () => {
      queryClient.setQueryData([authLogoutInProgressKey], true);

      return trpc.auth.logout.mutate();
    },
    onSuccess: ({ endSessionUrl }) => {
      queryClient.setQueryData(["auth.me"], false);
      queryClient.setQueryData([authLogoutInProgressKey], false);

      if (endSessionUrl) {
        window.location.href = endSessionUrl;
      } else {
        router.navigate({ to: routeAuthLogin.fullPath, replace: true });
      }
    },
    onError: () => {
      queryClient.setQueryData([authLogoutInProgressKey], false);
    },
  });

  const authInProgress = !!queryClient.getQueryData([authInProgressKey]) || false;
  const authLogoutInProgress = !!queryClient.getQueryData([authLogoutInProgressKey]) || false;

  const value = useMemo(
    () => ({
      loginMutation,
      loginCallbackMutation,
      loginWithTokenMutation,
      loginWithServiceAccountTokenMutation,
      logoutMutation,
      user: meQuery.data,
      isLoading: meQuery.isLoading,
      isAuthenticated,
      authInProgress,
      oidcEnabled,
    }),
    [
      authInProgress,
      isAuthenticated,
      loginCallbackMutation,
      loginMutation,
      loginWithTokenMutation,
      loginWithServiceAccountTokenMutation,
      logoutMutation,
      meQuery.data,
      meQuery.isLoading,
      oidcEnabled,
    ]
  );

  if ((meQuery.isLoading && !meQuery.isError) || authInProgress || authLogoutInProgress) {
    return <LoadingProgressBar />;
  }

  return <AuthContext value={value}>{children}</AuthContext>;
};
