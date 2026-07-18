import { RouteParams } from "@/core/router/types";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { cn } from "@/core/utils/classname";
import { Severity, SEVERITY_ICON, SEVERITY_ICON_COLOR_CLASS } from "@/core/utils/severity";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { ExternalToast, toast } from "sonner";

export type ToastVariant = Severity | "loading";

interface ExternalLink {
  url: string;
  text: string;
}

// A toast navigates either in-app or externally, never both: with both set the
// external anchor would nest inside the route Link (invalid HTML, double-fire).
type ToastLinkOptions = { route?: RouteParams; externalLink?: never } | { route?: never; externalLink?: ExternalLink };

export type ToastOptions = ExternalToast &
  ToastLinkOptions & {
    description?: string;
    /** Called when the user follows the toast's route link. */
    onNavigate?: () => void;
  };

const ICON_COLOR_BY_VARIANT: Record<ToastVariant, string> = {
  ...SEVERITY_ICON_COLOR_CLASS,
  loading: "text-status-in-progress",
};

// eslint-disable-next-line react-refresh/only-export-components
const VariantIcon = ({ variant }: { variant: ToastVariant }) => {
  if (variant === "loading") {
    return <LoadingSpinner size={16} />;
  }
  const Icon = SEVERITY_ICON[variant];
  return <Icon className="h-4 w-4" aria-hidden="true" />;
};

// Fully custom toast component (Headless approach)
// eslint-disable-next-line react-refresh/only-export-components
const CustomToast = ({
  id,
  message,
  variant,
  route,
  externalLink,
  description,
  onNavigate,
}: {
  id: string | number;
  message: string;
  variant: ToastVariant;
  description?: string;
  onNavigate?: () => void;
} & ToastLinkOptions) => {
  const content = (
    <div className="flex items-start gap-3">
      <span className={cn("mt-0.5 shrink-0", ICON_COLOR_BY_VARIANT[variant])}>
        <VariantIcon variant={variant} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium group-hover:underline">{message}</p>
        {description && (
          <p title={description} className="text-muted-foreground mt-0.5 line-clamp-2 text-xs break-words">
            {description}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-popover text-popover-foreground flex w-[356px] max-w-[90vw] flex-col rounded-lg border p-3 shadow-lg">
      <div className="flex items-start gap-2">
        {route?.to ? (
          <Link
            to={route.to}
            params={route.params}
            className="group min-w-0 flex-1 text-left"
            onClick={() => {
              onNavigate?.();
              toast.dismiss(id);
            }}
          >
            {content}
          </Link>
        ) : (
          <div className="min-w-0 flex-1">{content}</div>
        )}
        <button
          onClick={() => toast.dismiss(id)}
          className="text-muted-foreground hover:text-foreground -m-1 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md p-1 transition-colors"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
      {externalLink && (
        <a
          href={externalLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 ml-7 self-start text-xs font-medium underline underline-offset-4 hover:no-underline"
          onClick={() => toast.dismiss(id)}
        >
          {externalLink.text}
        </a>
      )}
    </div>
  );
};

// Helper to show toast with optional links
export const showToast = (message: string, variant: ToastVariant, options?: ToastOptions) => {
  const { route, externalLink, description, onNavigate, ...sonnerOptions } = options || {};

  return toast.custom(
    (id) => (
      <CustomToast
        id={id}
        message={message}
        variant={variant}
        description={description}
        onNavigate={onNavigate}
        {...(route ? { route } : { externalLink })}
      />
    ),
    {
      ...sonnerOptions,
      duration: variant === "loading" ? Infinity : sonnerOptions.duration,
    }
  );
};
