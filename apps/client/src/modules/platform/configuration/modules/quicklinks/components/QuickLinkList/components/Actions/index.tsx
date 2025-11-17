import { QuickLink } from "@my-project/shared";
import { QuickLinkActionsMenu } from "../../../QuickLinkActionsMenu";
import React from "react";
import { EllipsisVertical } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger } from "@/core/components/ui/dropdown-menu";

export const Actions = ({ quickLink }: { quickLink: QuickLink }) => {
  const [open, setOpen] = React.useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={"Options"}>
          <EllipsisVertical />
        </Button>
      </DropdownMenuTrigger>
      <QuickLinkActionsMenu
        variant="menu"
        data={{
          quickLink,
        }}
      />
    </DropdownMenu>
  );
};
