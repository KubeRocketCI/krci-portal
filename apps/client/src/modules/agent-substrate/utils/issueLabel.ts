import type { AgentIssue } from "@my-project/shared";

export const issueLabel = ({ projectPath, iid }: AgentIssue) => `${projectPath}#${iid}`;
