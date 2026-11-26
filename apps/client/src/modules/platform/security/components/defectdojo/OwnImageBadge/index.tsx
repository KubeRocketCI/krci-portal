import { Badge } from "@/core/components/ui/badge";

export interface OwnImageBadgeProps {
  /** The image is built from the codebase, not one of the third-party images of its chart. */
  ownImage: boolean;
}

export function OwnImageBadge({ ownImage }: OwnImageBadgeProps) {
  return <Badge variant={ownImage ? "info" : "neutral"}>{ownImage ? "Own image" : "Third-party image"}</Badge>;
}
