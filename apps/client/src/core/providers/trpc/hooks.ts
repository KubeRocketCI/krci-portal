import { useContext } from "react";
import { TRPCContext } from "./context";

export const useTRPCClient = () => {
  const client = useContext(TRPCContext);
  if (!client) {
    throw new Error("useTRPCClient must be used within TRPCProvider");
  }
  return client;
};
