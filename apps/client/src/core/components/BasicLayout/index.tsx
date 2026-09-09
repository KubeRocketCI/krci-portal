import React from "react";
import { useAuth } from "@/core/auth/provider/hooks";

function BasicLayout({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();

  // isAuthenticated is false while the session check is in flight, so the loading guard is
  // what keeps an authenticated reload from mounting the image and fetching it anyway.
  const showBackground = !isLoading && !isAuthenticated;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {showBackground && (
        <div className="absolute inset-0 -z-10">
          <img src="/bg.png" alt="auth-background" className="h-full w-full object-cover object-top" />
          <div className="absolute inset-0 bg-black opacity-50" />
        </div>
      )}
      {children}
    </div>
  );
}

export default BasicLayout;
