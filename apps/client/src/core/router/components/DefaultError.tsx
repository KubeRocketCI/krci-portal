import { ErrorContent } from "@/core/components/ErrorContent";
import type { RequestError } from "@/core/types/global";
import React from "react";

type DefaultErrorProps = { error: unknown };

export const DefaultError: React.FC<DefaultErrorProps> = ({ error }) => {
  const requestError = (error as RequestError) ?? null;
  return <ErrorContent error={requestError} orientation="vertical" />;
};
