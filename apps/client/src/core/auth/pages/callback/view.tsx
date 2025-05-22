import React from "react";
import { useAuth } from "../../providers/Auth";

export default function AuthCallbackPage() {
  const { loginCallbackMutation } = useAuth();

  React.useEffect(() => {
    loginCallbackMutation!.mutate(window.location.href);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
