import { useSearch } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useCallback } from "react";
import { Button, Divider } from "@mui/material";
import withStyles from "@mui/styles/withStyles";
import { routeAuthLogin } from "./route";
import { Alert, AlertDescription, AlertTitle } from "@/core/components/ui/alert";
import { useAuth } from "../../provider/hooks";

const ColorButton = withStyles((theme) => ({
  root: {
    color: theme.palette.primary.contrastText,
    backgroundColor: theme.palette.primary.dark,
    padding: "0.5rem 2rem",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      opacity: "0.7",
    },
  },
}))(Button);

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
                <Button variant="contained" fullWidth disabled>
                  <Loader2 className="animate-spin" />
                  Signing In
                </Button>
              ) : (
                <Button variant="contained" fullWidth onClick={handleLogin}>
                  Sign In
                </Button>
              )}
              <div className="flex flex-row gap-2 items-center px-4">
                <Divider
                  orientation="horizontal"
                  sx={{
                    flexGrow: 1,
                    borderStyle: "dashed",
                    borderColor: (t) => t.palette.secondary.dark,
                  }}
                />
                <span>or</span>
                <Divider
                  orientation="horizontal"
                  sx={{
                    flexGrow: 1,
                    borderStyle: "dashed",
                    borderColor: (t) => t.palette.secondary.dark,
                  }}
                />
              </div>
              <ColorButton variant="contained" fullWidth>
                use token
              </ColorButton>
            </div>
          </div>

          {loginMutation?.isError || loginCallbackMutation?.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </div>
  );
}
