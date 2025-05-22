import { z } from "zod";
export declare const userDBSchema: z.ZodObject<{
    id: z.ZodNumber;
    username: z.ZodString;
    password: z.ZodString;
    created_at: z.ZodDate;
}, "strict", z.ZodTypeAny, {
    id: number;
    username: string;
    password: string;
    created_at: Date;
}, {
    id: number;
    username: string;
    password: string;
    created_at: Date;
}>;
export type UserDBModel = z.infer<typeof userDBSchema>;
