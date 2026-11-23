import type { ActorIssue } from "@my-project/shared";

export const issueLabel = ({ projectPath, iid }: ActorIssue) => `${projectPath}#${iid}`;
