import { useSearch } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useCallback } from "react";
import { routeAuthLogin } from "./route";
import { Alert } from "@/core/components/ui/alert";
import { Button } from "@/core/components/ui/button";
import { useAuth } from "../../provider/hooks";

export default function LoginPage() {
  const { loginMutation, loginCallbackMutation } = useAuth();
  const search = useSearch({ from: routeAuthLogin.fullPath });

  const handleLogin = useCallback(
    () =>
      loginMutation!.mutate!({
        redirectSearchParam: search?.redirect,
      }),
    [loginMutation, search?.redirect]
  );

  return (
    <div className="flex w-full grow items-center justify-center">
      <div className="z-1 mx-[5vw] w-full max-w-lg rounded-sm bg-white px-6 py-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="space-y-4 text-center">
            <div>
              <img src="/krci-logo.svg" alt="kuberocket-ci-logo" className="mx-auto h-16 w-16" />
            </div>
            <h1 className="text-4xl font-medium">KubeRocketCI</h1>
            <p className="text-lg font-bold">Your Kubernetes Experience</p>
          </div>

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
                variant="default"
                className="bg-primary-dark text-primary-foreground hover:bg-primary-dark/70 w-full px-8 py-2"
              >
                Use Token
              </Button>
            </div>
          </div>

          {loginMutation?.isError || loginCallbackMutation?.isError ? (
            <Alert variant="destructive" title="Error">
              Something went wrong. Please try again.
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  );
}
