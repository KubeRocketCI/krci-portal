import { RouteParams } from "@/core/router/types";
import { STATUS_COLOR } from "@/k8s/constants/colors";
import { LoadingSpinner } from "@/core/components/ui/LoadingSpinner";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, CircleCheck, CircleX, Info, TriangleAlert, X } from "lucide-react";
import { ExternalToast, toast } from "sonner";
import { useState } from "react";

export type ToastVariant = "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions extends ExternalToast {
  route?: RouteParams;
  externalLink?: {
    url: string;
    text: string;
  };
  description?: string;
}

// Helper to get variant-specific icon
const getVariantIcon = (variant: ToastVariant) => {
  switch (variant) {
    case "success":
      return <CircleCheck size={20} />;
    case "error":
      return <CircleX size={20} />;
    case "warning":
      return <TriangleAlert size={20} />;
    case "loading":
      return <LoadingSpinner size={20} />;
    case "info":
    default:
      return <Info size={20} />;
  }
};

// Helper to get variant-specific styling
const getVariantStyles = (variant: ToastVariant) => {
  switch (variant) {
    case "success":
      return {
        backgroundColor: STATUS_COLOR.SUCCESS,
        borderColor: STATUS_COLOR.SUCCESS,
        color: "#FFFFFF",
      };
    case "error":
      return {
        backgroundColor: STATUS_COLOR.ERROR,
        borderColor: STATUS_COLOR.ERROR,
        color: "#FFFFFF",
      };
    case "warning":
      return {
        backgroundColor: STATUS_COLOR.MISSING,
        borderColor: STATUS_COLOR.MISSING,
        color: "#FFFFFF",
      };
    case "loading":
      return {
        backgroundColor: STATUS_COLOR.IN_PROGRESS,
        borderColor: STATUS_COLOR.IN_PROGRESS,
        color: "#FFFFFF",
      };
    case "info":
    default:
      return {
        backgroundColor: STATUS_COLOR.IN_PROGRESS,
        borderColor: STATUS_COLOR.IN_PROGRESS,
        color: "#FFFFFF",
      };
  }
};

// Fully custom toast component (Headless approach)
const CustomToast = ({
  id,
  message,
  variant,
  route,
  externalLink,
  description,
}: {
  id: string | number;
  message: string;
  variant: ToastVariant;
  route?: RouteParams;
  externalLink?: { url: string; text: string };
  description?: string;
}) => {
  const variantStyles = getVariantStyles(variant);
  const variantIcon = getVariantIcon(variant);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="flex flex-col rounded-lg border shadow-lg"
      style={{
        minWidth: "400px",
        maxWidth: "600px",
        padding: "12px 16px",
        ...variantStyles,
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 text-white">{variantIcon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{message}</p>
        </div>
        {description && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-70"
            style={{
              width: "24px",
              height: "24px",
              padding: "4px",
            }}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        )}
        {(route?.to || externalLink) && (
          <div className="flex items-center gap-2">
            {route?.to && (
              <Link
                to={route.to}
                params={route.params}
                className="text-xs font-medium text-white underline underline-offset-4 hover:no-underline"
                onClick={() => toast.dismiss()}
              >
                Go to page
              </Link>
            )}
            {externalLink && (
              <a
                href={externalLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-white underline underline-offset-4 hover:no-underline"
                onClick={() => toast.dismiss()}
              >
                {externalLink.text}
              </a>
            )}
          </div>
        )}
        <div style={{ marginLeft: description ? "0" : "16px" }}>
          <button
            onClick={() => toast.dismiss(id)}
            className="flex cursor-pointer items-center justify-center text-white transition-opacity hover:opacity-70"
            style={{
              width: "24px",
              height: "24px",
              padding: "4px",
            }}
            aria-label="Close toast"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      {description && isExpanded && (
        <div
          className="mt-2 text-xs text-white opacity-90"
          style={{
            marginLeft: "44px", // Align with message (icon width + gap)
            wordBreak: "break-word",
          }}
        >
          {description}
        </div>
      )}
    </div>
  );
};

// Helper to show toast with optional links
export const showToast = (message: string, variant: ToastVariant, options?: ToastOptions) => {
  const { route, externalLink, description, ...sonnerOptions } = options || {};

  return toast.custom(
    (id) => (
      <CustomToast
        id={id}
        message={message}
        variant={variant}
        route={route}
        externalLink={externalLink}
        description={description}
      />
    ),
    {
      ...sonnerOptions,
      duration: variant === "loading" ? Infinity : sonnerOptions.duration,
    }
  );
};
