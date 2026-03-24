import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { ExternalLink } from "lucide-react";
import React from "react";
import { CopyIconButton } from "../CopyIconButton";
import { cn } from "@/core/utils/classname";

const CARD_CLASS = "max-w-2xl border border-border shadow-sm";
const HEADER_CLASS = "flex items-center justify-between border-b border-border p-6";
const HEADER_ICON_BOX_CLASS = "flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary";
const ROW_CLASS = "px-6 py-4 transition-colors hover:bg-muted/50";
const ROW_ICON_BOX_CLASS = "flex h-8 w-8 items-center justify-center rounded-lg";
const MANAGED_BY_ROW_CLASS = "bg-muted/50 px-6 py-3";

interface IntegrationCardProps {
  children: React.ReactNode;
  className?: string;
}

export function IntegrationCard({ children, className }: IntegrationCardProps) {
  return <Card className={cn(CARD_CLASS, className)}>{children}</Card>;
}

interface IntegrationCardHeaderProps {
  icon: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
  subtitle: string;
  actions: React.ReactNode;
}

function IntegrationCardHeader({ icon, title, badge, subtitle, actions }: IntegrationCardHeaderProps) {
  return (
    <div className={HEADER_CLASS}>
      <div className="flex items-center gap-4">
        <div className={HEADER_ICON_BOX_CLASS}>{icon}</div>
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h4 className="text-foreground">{title}</h4>
            {badge}
          </div>
          <p className="text-muted-foreground text-xs">{subtitle}</p>
        </div>
      </div>
      {actions}
    </div>
  );
}

interface IntegrationCardLinkRowProps {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** When set, shows a copy button next to the external link (icon-change feedback, no toast). */
  copyValue?: string;
}

function IntegrationCardLinkRow({ label, href, icon, copyValue }: IntegrationCardLinkRowProps) {
  return (
    <div className={ROW_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(ROW_ICON_BOX_CLASS, "bg-primary/10 text-primary")}>{icon}</div>
          <div>
            <div className="text-foreground mb-0.5 text-sm">{label}</div>
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">
              {href}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {copyValue !== undefined && <CopyIconButton value={copyValue} />}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(href, "_blank")}>
            <ExternalLink className="text-muted-foreground h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface IntegrationCardTextRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBoxClassName?: string;
}

function IntegrationCardTextRow({
  label,
  value,
  icon,
  iconBoxClassName = "bg-primary/10 text-primary",
}: IntegrationCardTextRowProps) {
  return (
    <div className={ROW_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(ROW_ICON_BOX_CLASS, iconBoxClassName)}>{icon}</div>
          <div>
            <div className="text-foreground mb-0.5 text-sm">{label}</div>
            <div className="text-muted-foreground font-mono text-xs">{value}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IntegrationCardCopyableRowProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBoxClassName?: string;
}

function IntegrationCardCopyableRow({
  label,
  value,
  icon,
  iconBoxClassName = "bg-accent/15 text-accent-foreground",
}: IntegrationCardCopyableRowProps) {
  return (
    <div className={ROW_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(ROW_ICON_BOX_CLASS, iconBoxClassName)}>{icon}</div>
          <div>
            <div className="text-foreground mb-0.5 text-sm">{label}</div>
            <div className="text-muted-foreground font-mono text-xs">{value}</div>
          </div>
        </div>
        <CopyIconButton value={value} />
      </div>
    </div>
  );
}

interface IntegrationCardManagedByRowProps {
  text: string;
}

function IntegrationCardManagedByRow({ text }: IntegrationCardManagedByRowProps) {
  return (
    <div className={MANAGED_BY_ROW_CLASS}>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
          Managed by {text}
        </Badge>
      </div>
    </div>
  );
}

IntegrationCard.Header = IntegrationCardHeader;
IntegrationCard.LinkRow = IntegrationCardLinkRow;
IntegrationCard.TextRow = IntegrationCardTextRow;
IntegrationCard.CopyableRow = IntegrationCardCopyableRow;
IntegrationCard.ManagedByRow = IntegrationCardManagedByRow;
