// Path constants that must be importable from both `routes.ts` (route tree) and
// `@/core/auth` (route guards) without creating a circular import between them.

export const PATH_FORBIDDEN = "forbidden" as const;
export const PATH_FORBIDDEN_FULL = "/forbidden" as const;
