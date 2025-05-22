import { z } from "zod";

export const userDBSchema = z
  .object({
    id: z.number(),
    username: z.string(),
    password: z.string(),
    created_at: z.coerce.date(),
  })
  .strict();

export type UserDBModel = z.infer<typeof userDBSchema>;
