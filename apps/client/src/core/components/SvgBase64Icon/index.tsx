import React from "react";
import { decodeSvgIcon } from "@/core/utils/svgIcon";
import { cn } from "@/core/utils/classname";
import { errorBase64Icon } from "./constants";

const FALLBACK_SRC = `data:image/svg+xml;base64,${errorBase64Icon}`;

interface SvgBase64IconProps {
  icon: string | undefined;
  className?: string;
  /** Names the owning resource in the warning logged for an unusable icon. */
  label?: string;
}

export const SvgBase64Icon = ({ icon, className, label }: SvgBase64IconProps) => {
  const result = decodeSvgIcon(icon);
  const reason = result.status === "invalid" ? result.reason : undefined;

  React.useEffect(() => {
    if (reason) {
      console.warn(`Unusable SVG icon${label ? ` on "${label}"` : ""}: ${reason}.`, icon?.slice(0, 64));
    }
  }, [reason, label, icon]);

  if (result.status === "absent") {
    return null;
  }

  return (
    <img
      src={result.status === "ok" ? result.src : FALLBACK_SRC}
      alt=""
      title={reason && `Icon is broken: ${reason}`}
      className={cn("h-full w-full", className)}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null;
        currentTarget.src = FALLBACK_SRC;
        currentTarget.title = "Icon is broken";
      }}
    />
  );
};
