import React from "react";
import { useAuth } from "../../providers/Auth";
import { useQueryClient } from "@tanstack/react-query";

export default function AuthCallbackPage() {
  const { loginCallbackMutation } = useAuth();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (queryClient.getQueryData(["auth.me"])) {
      return;
    }

    loginCallbackMutation!.mutate(window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
