import React from "react";
import type { AppRouter } from "@my-project/trpc";
import type { TRPCClient } from "@trpc/client";

export const TRPCContext = React.createContext<TRPCClient<AppRouter> | null>(null);
