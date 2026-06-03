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

interface TokenFormProps {
  idPrefix: string;
  label: string;
  helpText: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
}

function TokenForm({
  idPrefix,
  label,
  helpText,
  value,
  onChange,
  onSubmit,
  onCancel,
  isPending,
  isError,
  errorMessage,
}: TokenFormProps) {
  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-token`}>{label}</Label>
          <Textarea
            id={`${idPrefix}-token`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste your token here..."
            rows={4}
            className="font-mono text-sm"
            disabled={isPending}
            spellCheck={false}
          />
          <p className="text-muted-foreground text-xs">{helpText}</p>
        </div>
        {isError && (
          <Alert variant="destructive" title="Error">
            {errorMessage || "Invalid token. Please try again."}
          </Alert>
        )}
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="default" disabled={isPending || !value.trim()} className="flex-1">
            {isPending ? (
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
  );
}

export default function LoginPage() {
  const {
    loginMutation,
    loginCallbackMutation,
    loginWithTokenMutation,
    loginWithServiceAccountTokenMutation,
    oidcEnabled,
  } = useAuth();
  const search = useSearch({ from: routeAuthLogin.fullPath });

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [showSATokenInput, setShowSATokenInput] = useState(false);
  const [token, setToken] = useState("");
  const [saToken, setSaToken] = useState("");

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

  const handleSATokenSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (saToken.trim()) {
        loginWithServiceAccountTokenMutation!.mutate!({
          token: saToken.trim(),
          redirectSearchParam: search?.redirect,
        });
      }
    },
    [loginWithServiceAccountTokenMutation, search?.redirect, saToken]
  );

  // The two token forms are mutually exclusive: opening one closes the other and
  // clears its field, so only a single token is ever entered at a time. A form's
  // own field is cleared only when it collapses, so re-opening preserves whatever
  // was already typed.
  const handleTokenButtonClick = useCallback(() => {
    setShowSATokenInput(false);
    setSaToken("");
    if (showTokenInput) {
      setToken("");
    }
    setShowTokenInput((prev) => !prev);
  }, [showTokenInput]);

  const handleSATokenButtonClick = useCallback(() => {
    setShowTokenInput(false);
    setToken("");
    if (showSATokenInput) {
      setSaToken("");
    }
    setShowSATokenInput((prev) => !prev);
  }, [showSATokenInput]);

  // When OIDC is disabled the SA-token option is shown directly (not hidden
  // behind "More options"), since it is the only available login method.
  const showSecondaryOptions = showMoreOptions || !oidcEnabled;

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
              {oidcEnabled && (
                <>
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
                  <Button variant="link" className="w-full" onClick={() => setShowMoreOptions((prev) => !prev)}>
                    More options
                  </Button>
                </>
              )}

              {showSecondaryOptions && (
                <>
                  {oidcEnabled && (
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
                  )}
                  <Button
                    variant="outline"
                    className={`w-full ${showSATokenInput ? "border-primary" : ""}`}
                    onClick={handleSATokenButtonClick}
                    disabled={loginWithServiceAccountTokenMutation?.isPending}
                  >
                    {loginWithServiceAccountTokenMutation?.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In
                      </>
                    ) : (
                      "Use Service Account Token"
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          {showTokenInput && oidcEnabled && (
            <TokenForm
              idPrefix="oidc"
              label="Access Token"
              helpText="Enter your OIDC access token to sign in."
              value={token}
              onChange={setToken}
              onSubmit={handleTokenSubmit}
              onCancel={handleTokenButtonClick}
              isPending={!!loginWithTokenMutation?.isPending}
              isError={!!loginWithTokenMutation?.isError}
              errorMessage={loginWithTokenMutation?.error?.message}
            />
          )}

          {showSATokenInput && (
            <TokenForm
              idPrefix="sa"
              label="Service Account Token"
              helpText="Paste a Kubernetes Service Account token (e.g. from `kubectl create token <sa> -n <ns>`)."
              value={saToken}
              onChange={setSaToken}
              onSubmit={handleSATokenSubmit}
              onCancel={handleSATokenButtonClick}
              isPending={!!loginWithServiceAccountTokenMutation?.isPending}
              isError={!!loginWithServiceAccountTokenMutation?.isError}
              errorMessage={loginWithServiceAccountTokenMutation?.error?.message}
            />
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
