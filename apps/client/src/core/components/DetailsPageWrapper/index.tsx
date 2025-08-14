import { ErrorContent } from "@/core/components/ErrorContent";
import { LoadingWrapper } from "@/core/components/misc/LoadingWrapper";
import type { RequestError } from "@/core/types/global";
import React from "react";

interface ContentErrorBoundaryProps {
  error: RequestError | null;
  isLoading: boolean;
  children: React.ReactNode;
}

export function ContentErrorBoundary({ error, isLoading, children }: ContentErrorBoundaryProps) {
  if (error) {
    return <ErrorContent error={error} />;
  }

  return <LoadingWrapper isLoading={isLoading}>{children}</LoadingWrapper>;
}
