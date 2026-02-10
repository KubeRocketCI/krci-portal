import { useSearch } from "@tanstack/react-router";
import { BookOpenText, Loader2, MessageSquareMore, MessageSquareShare } from "lucide-react";
import { useCallback, useState } from "react";
import { routeAuthLogin } from "./route";
import { Alert } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { useAuth } from "../../provider/hooks";
import { ThemeSwitcher } from "@/core/components/ThemeSwitcher";
import { Link } from "@tanstack/react-router";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";
import { Tooltip, TooltipProvider } from "@/core/components/ui/tooltip";
import { Textarea } from "@/core/components/ui/textarea";
import { Label } from "@/core/components/ui/label";

const HELP_MENU_LIST = [
  {
    id: 0,
    label: "Documentation",
    icon: BookOpenText,
    url: EDP_USER_GUIDE.OVERVIEW.url,
  },
  {
    id: 1,
    label: "Join Discussions",
    icon: MessageSquareMore,
    url: "https://github.com/KubeRocketCI/docs/discussions",
  },
  {
    id: 2,
    label: "Open an issue/request",
    icon: MessageSquareShare,
    url: "https://github.com/epam/edp-install/issues/new/choose",
  },
];

export default function LoginPage() {
  const { loginMutation, loginCallbackMutation, loginWithTokenMutation } = useAuth();
  const search = useSearch({ from: routeAuthLogin.fullPath });
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState("");

  const isSessionExpired = search?.reason === "session-expired";

  const handleLogin = useCallback(
    () =>
      loginMutation!.mutate!({
        redirectSearchParam: search?.redirect,
      }),
    [loginMutation, search?.redirect]
  );

  const handleTokenSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (token.trim()) {
        loginWithTokenMutation!.mutate!({
          token: token.trim(),
          redirectSearchParam: search?.redirect,
        });
      }
    },
    [loginWithTokenMutation, search?.redirect, token]
  );

  const handleTokenButtonClick = useCallback(() => {
    setShowTokenInput(!showTokenInput);
    if (showTokenInput) {
      setToken("");
    }
  }, [showTokenInput]);

  return (
    <div className="flex w-full grow items-center justify-center">
      <div className="bg-card z-1 mx-[5vw] w-full max-w-lg rounded-lg px-6 py-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="space-y-4 text-center">
            <div>
              <img src="/krci-logo.svg" alt="kuberocket-ci-logo" className="mx-auto h-16 w-16" />
            </div>
            <h1 className="text-foreground text-4xl font-medium">KubeRocketCI</h1>
            <p className="text-foreground text-lg font-bold">Your Kubernetes Experience</p>
          </div>

          {isSessionExpired && (
            <Alert variant="default" title="Session Expired">
              Your session has expired. Please sign in again to continue.
            </Alert>
          )}

          <div className="w-full max-w-72">
            <div className="flex flex-col gap-4">
              {loginMutation?.isPending ? (
                <Button variant="default" className="w-full" disabled>
                  <Loader2 className="animate-spin" />
                  Signing In
                </Button>
              ) : (
                <Button variant="default" className="w-full" onClick={handleLogin}>
                  Sign In
                </Button>
              )}
              <div className="flex flex-row items-center gap-2 px-4">
                <hr className="border-secondary-dark grow border-dashed" />
                <span>or</span>
                <hr className="border-secondary-dark grow border-dashed" />
              </div>
              <Button
                variant="outline"
                className={`w-full ${showTokenInput ? "border-primary" : ""}`}
                onClick={handleTokenButtonClick}
                disabled={loginWithTokenMutation?.isPending}
              >
                {loginWithTokenMutation?.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In
                  </>
                ) : (
                  "Use Token"
                )}
              </Button>
            </div>
          </div>

          {showTokenInput && (
            <div className="w-full">
              <form onSubmit={handleTokenSubmit} className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="token">Access Token</Label>
                  <Textarea
                    id="token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your access token here..."
                    rows={4}
                    className="font-mono text-sm"
                    disabled={loginWithTokenMutation?.isPending}
                    spellCheck={false}
                  />
                  <p className="text-muted-foreground text-xs">Enter your OIDC access token to sign in.</p>
                </div>
                {loginWithTokenMutation?.isError && (
                  <Alert variant="destructive" title="Error">
                    {loginWithTokenMutation.error?.message || "Invalid token. Please try again."}
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleTokenButtonClick}
                    disabled={loginWithTokenMutation?.isPending}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="default"
                    disabled={loginWithTokenMutation?.isPending || !token.trim()}
                    className="flex-1"
                  >
                    {loginWithTokenMutation?.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loginMutation?.isError || loginCallbackMutation?.isError ? (
            <Alert variant="destructive" title="Error">
              Something went wrong. Please try again.
            </Alert>
          ) : null}
        </div>
      </div>

      <TooltipProvider>
        <div className="border-border bg-card/80 fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 shadow-lg backdrop-blur-sm">
          <Tooltip title="Toggle theme" placement="top">
            <ThemeSwitcher className="h-8 w-8" />
          </Tooltip>

          {HELP_MENU_LIST.map(({ id, url, icon: Icon, label }) => {
            return (
              <Tooltip key={id} title={label} placement="top">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                  <Link to={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="h-4 w-4" />
                  </Link>
                </Button>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
