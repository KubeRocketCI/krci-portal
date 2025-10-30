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
import { useClusterStore } from "@/k8s/store";

export const authInProgressKey = "authInProgress";
export const authLogoutInProgressKey = "authLogoutInProgress";

const getLoginOriginURL = (redirectSearchParam?: string) =>
  `${location.origin}${routeAuthCallback.fullPath}?redirect=${redirectSearchParam || routeHome.fullPath}`;

export const AuthProvider = ({ children }: React.PropsWithChildren) => {
  const queryClient = useQueryClient();
  const clusterStore = useClusterStore();

  // Fetch server configuration at startup
  const configQuery = useQuery({
    queryKey: ["server.config"],
    queryFn: () => trpc.config.get.query(),
    retry: 1,
    staleTime: Infinity, // Config doesn't change during session
    gcTime: Infinity, // Never garbage collect the data
  });

  // Initialize cluster store with server config when available
  useMemo(() => {
    if (configQuery.data) {
      const { clusterName, defaultNamespace } = configQuery.data;

      // Only initialize if not already set
      if (!clusterStore.clusterName) {
        clusterStore.setClusterName(clusterName);

        // Check if user has custom namespace settings in localStorage
        const settings = localStorage.getItem("cluster_settings");
        if (!settings || !JSON.parse(settings)[clusterName]) {
          clusterStore.setDefaultNamespace(defaultNamespace);
          clusterStore.setAllowedNamespaces([defaultNamespace]);
        }
      }
    }
  }, [configQuery.data, clusterStore]);

  const meQuery = useQuery({
    queryKey: ["auth.me"],
    queryFn: () => trpc.auth.me.query(),
    enabled: !window.location.href.includes(routeAuthCallback.fullPath), // Login process goes through /login and /auth/callback pages
    retry: false,
    refetchOnWindowFocus: true, // Ensure that user's session is still valid on page focus
    refetchOnReconnect: true, // Refetch if the app regains connection,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: Infinity, // Never consider the data stale - auth state should persist
    gcTime: Infinity, // Never garbage collect the data
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

  if ((meQuery.isLoading && !meQuery.isError) || authInProgress || authLogoutInProgress || configQuery.isLoading) {
    return <LoadingProgressBar />;
  }

  if (configQuery.isError) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Configuration Error</h2>
        <p>Failed to load server configuration. Please check your deployment environment variables.</p>
        <p style={{ color: "red", fontSize: "12px" }}>{configQuery.error?.message}</p>
      </div>
    );
  }

  return <AuthContext value={value}>{children}</AuthContext>;
};
