import z from "zod";
import { jiraServerDraftSchema, jiraServerSchema } from "..";

export type JiraServer = z.infer<typeof jiraServerSchema>;
export type JiraServerDraft = z.infer<typeof jiraServerDraftSchema>;
