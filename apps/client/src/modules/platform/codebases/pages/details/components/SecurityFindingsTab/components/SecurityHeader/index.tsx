import { ExternalLink } from "lucide-react";
import { cn } from "@/core/utils/classname";
import { ICON_LINK_CLASS } from "@/modules/platform/security/components/defectdojo/utils";

interface SecurityHeaderProps {
  link?: string;
  lastUpdated?: Date;
}

export function SecurityHeader({ link, lastUpdated }: SecurityHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <div>
        <h3 className="text-foreground font-medium">Security findings</h3>
        <p className="text-muted-foreground text-xs">
          Active findings from DefectDojo
          {lastUpdated && (
            <>
              {" · Last updated "}
              <time dateTime={lastUpdated.toISOString()}>{lastUpdated.toLocaleString()}</time>
            </>
          )}
        </p>
      </div>
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(ICON_LINK_CLASS, "flex items-center gap-1 text-sm underline")}
        >
          Open in DefectDojo
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}
