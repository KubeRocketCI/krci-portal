import { ButtonWithPermission } from "@/core/components/ButtonWithPermission";
import { useApprovalTaskPermissions } from "@/k8s/api/groups/KRCI/ApprovalTask";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import React from "react";

export const ChoiceButtonGroup = ({
  options,
  type,
}: {
  options: { id: string; Icon: React.ReactNode; label: string; onClick: () => void }[];
  type: "accept" | "reject";
}) => {
  const [open, setOpen] = React.useState(false);
  const optionsWithoutFirstItem = options.slice(1);

  const approvalTaskPermissions = useApprovalTaskPermissions();

  return (
    <div className="flex">
      <ButtonWithPermission
        ButtonProps={{
          size: "sm",
          variant: type === "accept" ? "default" : "outline",
          onClick: options[0].onClick,
          className: "rounded-r-none border-r-0",
        }}
        allowed={approvalTaskPermissions.data?.patch?.allowed}
        reason={approvalTaskPermissions.data?.patch?.reason}
      >
        {options[0].Icon}
        {options[0].label}
      </ButtonWithPermission>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <ButtonWithPermission
            ButtonProps={{
              size: "sm",
              variant: type === "accept" ? "default" : "outline",
              className: "rounded-l-none",
            }}
            allowed={approvalTaskPermissions.data?.patch?.allowed}
            reason={approvalTaskPermissions.data?.patch?.reason}
          >
            <ChevronDown size={15} />
          </ButtonWithPermission>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="z-[1]">
          {optionsWithoutFirstItem.map((option) => (
            <DropdownMenuItem key={option.id} onClick={option.onClick} className="flex items-center gap-2">
              {option.Icon}
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
