import { ExternalLink } from "lucide-react";
import type { AgentIssue } from "@my-project/shared";
import { CellExternalLink } from "@/core/components/Table/components/CellLink";
import { TextWithTooltip } from "@/core/components/TextWithTooltip";
import { issueLabel } from "../../../../../utils/issueLabel";

export function IssueLink({ issue }: { issue: AgentIssue }) {
  const label = issueLabel(issue);
  if (!issue.url) return <TextWithTooltip text={label} />;
  return <CellExternalLink href={issue.url} text={label} icon={ExternalLink} />;
}
