import { User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
import { cn } from "@/core/utils/classname";

interface AuthorAvatarProps {
  /** Author name displayed in tooltip and used for initials */
  author: string;
  /** Avatar image URL (may fail to load for private repos) */
  avatarUrl?: string;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional class names */
  className?: string;
}

/**
 * Extract initials from author name
 * Examples:
 *   "John_Doe" → "JD"
 *   "john.doe" → "JD"
 *   "John Doe" → "JD"
 *   "johndoe" → "JO"
 */
const getInitials = (name: string): string => {
  if (!name) return "";

  // Split by common separators: underscore, dot, space, hyphen
  const parts = name.split(/[_.\s-]+/).filter(Boolean);

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Single word - take first two letters
  return name.slice(0, 2).toUpperCase();
};

const sizeClasses = {
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
} as const;

const iconSizes = {
  sm: "size-3",
  md: "size-4",
} as const;

/**
 * Author avatar component with automatic fallback to initials
 * - Shows avatar image if URL loads successfully
 * - Falls back to initials if image fails (401, 404, CORS, etc.)
 * - Falls back to User icon if initials can't be generated
 * - Native browser tooltip shows full author name on hover
 */
export const AuthorAvatar = ({ author, avatarUrl, size = "sm", className }: AuthorAvatarProps) => {
  const initials = getInitials(author);

  return (
    <span title={author}>
      <Avatar className={cn(sizeClasses[size], className)}>
        {avatarUrl && <AvatarImage src={avatarUrl} alt={author} />}
        <AvatarFallback className={cn("font-medium", sizeClasses[size])}>
          {initials || <User className={iconSizes[size]} />}
        </AvatarFallback>
      </Avatar>
    </span>
  );
};
