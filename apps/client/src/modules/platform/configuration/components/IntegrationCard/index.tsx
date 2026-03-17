import { Card } from "@/core/components/ui/card";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { ExternalLink } from "lucide-react";
import React from "react";
import { CopyIconButton } from "../CopyIconButton";
import { cn } from "@/core/utils/classname";

const CARD_CLASS = "max-w-2xl border-slate-200 bg-white shadow-sm";
const HEADER_CLASS = "flex items-center justify-between p-6 border-b border-slate-200";
const HEADER_ICON_BOX_CLASS = "w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center";
const ROW_CLASS = "px-6 py-4 hover:bg-slate-50 transition-colors";
const ROW_ICON_BOX_CLASS = "w-8 h-8 rounded-lg flex items-center justify-center";
const MANAGED_BY_ROW_CLASS = "px-6 py-3 bg-slate-50";

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
            <h4 className="text-slate-900">{title}</h4>
            {badge}
          </div>
          <p className="text-xs text-slate-500">{subtitle}</p>
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
          <div className={cn(ROW_ICON_BOX_CLASS, "bg-blue-50")}>{icon}</div>
          <div>
            <div className="mb-0.5 text-sm text-slate-900">{label}</div>
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
              {href}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {copyValue !== undefined && <CopyIconButton value={copyValue} />}
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(href, "_blank")}>
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
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

function IntegrationCardTextRow({ label, value, icon, iconBoxClassName = "bg-blue-50" }: IntegrationCardTextRowProps) {
  return (
    <div className={ROW_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(ROW_ICON_BOX_CLASS, iconBoxClassName)}>{icon}</div>
          <div>
            <div className="mb-0.5 text-sm text-slate-900">{label}</div>
            <div className="font-mono text-xs text-slate-600">{value}</div>
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
  iconBoxClassName = "bg-purple-50",
}: IntegrationCardCopyableRowProps) {
  return (
    <div className={ROW_CLASS}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(ROW_ICON_BOX_CLASS, iconBoxClassName)}>{icon}</div>
          <div>
            <div className="mb-0.5 text-sm text-slate-900">{label}</div>
            <div className="font-mono text-xs text-slate-600">{value}</div>
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
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
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
