import { z } from "zod";
export declare const loginInputSchema: z.ZodString;
export type LoginInput = z.infer<typeof loginInputSchema>;
export declare const loginCallbackInputSchema: z.ZodString;
export type LoginCallbackInput = z.infer<typeof loginCallbackInputSchema>;
export declare const OIDCUserSchema: z.ZodObject<{
    email: z.ZodString;
    email_verified: z.ZodBoolean;
    family_name: z.ZodString;
    given_name: z.ZodString;
    name: z.ZodString;
    preferred_username: z.ZodString;
    sub: z.ZodString;
    picture: z.ZodOptional<z.ZodString>;
    default_namespace: z.ZodOptional<z.ZodString>;
    groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    preferred_username: string;
    sub: string;
    picture?: string | undefined;
    default_namespace?: string | undefined;
    groups?: string[] | undefined;
}, {
    name: string;
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    preferred_username: string;
    sub: string;
    picture?: string | undefined;
    default_namespace?: string | undefined;
    groups?: string[] | undefined;
}>;
export type OIDCUser = z.infer<typeof OIDCUserSchema>;
export declare const loginCallbackOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    userInfo: z.ZodOptional<z.ZodObject<{
        email: z.ZodString;
        email_verified: z.ZodBoolean;
        family_name: z.ZodString;
        given_name: z.ZodString;
        name: z.ZodString;
        preferred_username: z.ZodString;
        sub: z.ZodString;
        picture: z.ZodOptional<z.ZodString>;
        default_namespace: z.ZodOptional<z.ZodString>;
        groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        email: string;
        email_verified: boolean;
        family_name: string;
        given_name: string;
        preferred_username: string;
        sub: string;
        picture?: string | undefined;
        default_namespace?: string | undefined;
        groups?: string[] | undefined;
    }, {
        name: string;
        email: string;
        email_verified: boolean;
        family_name: string;
        given_name: string;
        preferred_username: string;
        sub: string;
        picture?: string | undefined;
        default_namespace?: string | undefined;
        groups?: string[] | undefined;
    }>>;
    clientSearch: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    success: boolean;
    userInfo?: {
        name: string;
        email: string;
        email_verified: boolean;
        family_name: string;
        given_name: string;
        preferred_username: string;
        sub: string;
        picture?: string | undefined;
        default_namespace?: string | undefined;
        groups?: string[] | undefined;
    } | undefined;
    clientSearch?: string | undefined;
}, {
    success: boolean;
    userInfo?: {
        name: string;
        email: string;
        email_verified: boolean;
        family_name: string;
        given_name: string;
        preferred_username: string;
        sub: string;
        picture?: string | undefined;
        default_namespace?: string | undefined;
        groups?: string[] | undefined;
    } | undefined;
    clientSearch?: string | undefined;
}>;
export type LoginCallbackOutput = z.infer<typeof loginCallbackOutputSchema>;
export declare const loginOutputSchema: z.ZodObject<{
    authUrl: z.ZodString;
}, "strict", z.ZodTypeAny, {
    authUrl: string;
}, {
    authUrl: string;
}>;
export type LoginOutput = z.infer<typeof loginOutputSchema>;
export declare const logoutOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success: boolean;
}, {
    success: boolean;
}>;
export type LogoutnOutput = z.infer<typeof logoutOutputSchema>;
export declare const meOutputSchema: z.ZodOptional<z.ZodObject<{
    email: z.ZodString;
    email_verified: z.ZodBoolean;
    family_name: z.ZodString;
    given_name: z.ZodString;
    name: z.ZodString;
    preferred_username: z.ZodString;
    sub: z.ZodString;
    picture: z.ZodOptional<z.ZodString>;
    default_namespace: z.ZodOptional<z.ZodString>;
    groups: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    preferred_username: string;
    sub: string;
    picture?: string | undefined;
    default_namespace?: string | undefined;
    groups?: string[] | undefined;
}, {
    name: string;
    email: string;
    email_verified: boolean;
    family_name: string;
    given_name: string;
    preferred_username: string;
    sub: string;
    picture?: string | undefined;
    default_namespace?: string | undefined;
    groups?: string[] | undefined;
}>>;
export type MeOutput = z.infer<typeof meOutputSchema>;
