// Export tRPC setup
export { t, router, publicProcedure, protectedProcedure } from "./trpc";

// Export routers
export { appRouter } from "./routers";
export type { AppRouter, RouterInput, RouterOutput } from "./routers";

// Export context types
export type { TRPCContext, CustomSession } from "./context/types";

// Export context creation
export { createContext } from "./context/create";
export * from "./clients";
