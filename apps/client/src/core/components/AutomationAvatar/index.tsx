import { UserRoundCog } from "lucide-react";
import { Avatar, AvatarFallback } from "@/core/components/ui/avatar";
import { cn } from "@/core/utils/classname";

interface AutomationAvatarProps {
  /** Service-account (or other system principal) name shown in the tooltip. */
  name: string;
  size?: "sm" | "md";
  className?: string;
}

const sizeClasses = {
  sm: "size-6",
  md: "size-8",
} as const;

// Glyph is sized below the circle (unlike AuthorAvatar's initials) so the finer
// person+cog detail stays legible; circle size is fixed by sizeClasses.
const iconSizes = {
  sm: "size-4",
  md: "size-5",
} as const;

/**
 * Automation/service-account indicator — the non-human counterpart to AuthorAvatar's human
 * initials, for actors classified as automation (e.g. Tekton trigger service accounts). The
 * person+cog glyph reads as "a configured/automated identity". Native browser tooltip shows
 * the full actor name on hover.
 */
export const AutomationAvatar = ({ name, size = "sm", className }: AutomationAvatarProps) => {
  return (
    <span title={name}>
      <Avatar className={cn(sizeClasses[size], className)}>
        <AvatarFallback className={sizeClasses[size]}>
          <UserRoundCog className={iconSizes[size]} />
        </AvatarFallback>
      </Avatar>
    </span>
  );
};
