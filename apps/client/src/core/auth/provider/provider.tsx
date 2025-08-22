import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  AuthCallbackLoginInput,
  AuthCallbackLoginOutput,
  AuthContext,
  AuthLoginOutput,
  AuthLogoutOutput,
  LoginMutationInput,
} from "./context";
import { trpc } from "@/core/clients/trpc";
import { LoadingProgressBar } from "@/core/components/ui/LoadingProgressBar";
import { router } from "@/core/router";
import { routeHome } from "@/modules/home/pages/home/route";
import { routeAuthCallback } from "../pages/callback/route";
import { routeAuthLogin } from "../pages/login/route";

export const authInProgressKey = "authInProgress";
export const authLogoutInProgressKey = "authLogoutInProgress";

const getLoginOriginURL = (redirectSearchParam?: string) =>
  `${location.origin}${routeAuthCallback.fullPath}?redirect=${redirectSearchParam || routeHome.fullPath}`;

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient();
  queryClient.setQueryData(["clusterName"], import.meta.env.VITE_K8S_DEFAULT_CLUSTER_NAME);

  const meQuery = useQuery({
    queryKey: ["auth.me"],
    queryFn: () => trpc.auth.me.query(),
    enabled: !window.location.href.includes(routeAuthCallback.fullPath), // Login process goes through /login and /auth/callback pages
    retry: false,
    refetchOnWindowFocus: true, // Ensure that user's session is still valid on page focus
    refetchOnReconnect: true, // Refetch if the app regains connection,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 5 * 60 * 1000, // Cache the data for 5 minutes
  });

  const isAuthenticated = meQuery.isFetched && !!meQuery.data;

  const loginMutation = useMutation<AuthLoginOutput, Error, LoginMutationInput>({
    mutationKey: ["auth.login"],
    mutationFn: ({ redirectSearchParam }) => {
      return trpc.auth.login.mutate(getLoginOriginURL(redirectSearchParam));
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

  const logoutMutation = useMutation<AuthLogoutOutput, Error, void>({
    mutationKey: ["auth.logout"],
    mutationFn: () => {
      queryClient.setQueryData([authLogoutInProgressKey], true);

      return trpc.auth.logout.mutate();
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth.me"], false);
      router.navigate({ to: routeAuthLogin.fullPath, replace: true });
      queryClient.setQueryData([authLogoutInProgressKey], false);
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
      logoutMutation,
      user: meQuery.data,
      isLoading: meQuery.isLoading,
      isAuthenticated,
      authInProgress,
    }),
    [
      authInProgress,
      isAuthenticated,
      loginCallbackMutation,
      loginMutation,
      logoutMutation,
      meQuery.data,
      meQuery.isLoading,
    ]
  );

  if ((meQuery.isLoading && !meQuery.isError) || authInProgress || authLogoutInProgress) {
    return <LoadingProgressBar />;
  }

  return <AuthContext value={value}>{children}</AuthContext>;
};
