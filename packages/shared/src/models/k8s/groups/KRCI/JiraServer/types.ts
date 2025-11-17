import z from "zod";
import { jiraServerDraftSchema, jiraServerSchema, jiraServerStatusEnum } from "../index.js";

export type JiraServer = z.infer<typeof jiraServerSchema>;
export type JiraServerDraft = z.infer<typeof jiraServerDraftSchema>;

export type JiraServerStatus = z.infer<typeof jiraServerStatusEnum>;
