import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import {
  AuthCallbackLoginInput,
  AuthCallbackLoginOutput,
  AuthContext,
  AuthLoginOutput,
  AuthLoginWithTokenOutput,
  AuthLogoutOutput,
  LoginMutationInput,
  LoginWithTokenMutationInput,
} from "./context";
import { trpcHttpClient } from "@/core/providers/trpc/http-client";
import { LoadingProgressBar } from "@/core/components/ui/LoadingProgressBar";
import { CriticalError } from "@/core/components/CriticalError";
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
  const trpc = trpcHttpClient;

  // Get stable setter functions from the store
  const clusterName = useClusterStore((state) => state.clusterName);
  const setClusterName = useClusterStore((state) => state.setClusterName);
  const setDefaultNamespace = useClusterStore((state) => state.setDefaultNamespace);
  const setAllowedNamespaces = useClusterStore((state) => state.setAllowedNamespaces);
  const setSonarWebUrl = useClusterStore((state) => state.setSonarWebUrl);
  const setDependencyTrackWebUrl = useClusterStore((state) => state.setDependencyTrackWebUrl);

  // Fetch server configuration at startup
  const configQuery = useQuery({
    queryKey: ["server.config"],
    queryFn: () => trpc.config.get.query(),
    retry: 1,
    staleTime: Infinity, // Config doesn't change during session
    gcTime: Infinity, // Never garbage collect the data
  });

  // Initialize cluster store with server config when available
  useEffect(() => {
    if (configQuery.data) {
      const { clusterName: serverClusterName, defaultNamespace, sonarWebUrl, dependencyTrackWebUrl } = configQuery.data;

      // Only initialize if not already set
      if (!clusterName) {
        setClusterName(serverClusterName);

        // Check if user has custom namespace settings in localStorage
        const settings = localStorage.getItem("cluster_settings");
        if (!settings || !JSON.parse(settings)[serverClusterName]) {
          setDefaultNamespace(defaultNamespace);
          setAllowedNamespaces([defaultNamespace]);
        }
      }

      // Always update security tool URLs from server config
      setSonarWebUrl(sonarWebUrl);
      setDependencyTrackWebUrl(dependencyTrackWebUrl);
    }
  }, [
    configQuery.data,
    clusterName,
    setClusterName,
    setDefaultNamespace,
    setAllowedNamespaces,
    setSonarWebUrl,
    setDependencyTrackWebUrl,
  ]);

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

  const loginWithTokenMutation = useMutation<AuthLoginWithTokenOutput, Error, LoginWithTokenMutationInput>({
    mutationKey: ["auth.loginWithToken"],
    mutationFn: ({ token, redirectSearchParam }) => {
      return trpc.auth.loginWithToken.mutate({
        token,
        redirectSearchParam,
      });
    },
    onSuccess: ({ success, userInfo, clientSearch }) => {
      if (success && userInfo) {
        queryClient.setQueryData(["auth.me"], userInfo);

        const clientSearchParams = new URLSearchParams(clientSearch || "");
        const redirect = clientSearchParams.get("redirect") || routeHome.fullPath;

        router.navigate({ to: redirect, replace: true });
      }
    },
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
      loginWithTokenMutation,
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
      <CriticalError
        title="Configuration Error"
        message="Failed to load server configuration. Please check your deployment environment variables."
        error={configQuery.error}
        onRetry={() => configQuery.refetch()}
        showActions={true}
      />
    );
  }

  return <AuthContext value={value}>{children}</AuthContext>;
};
