import { ChevronsUpDown, FileUser, Shield } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/core/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/core/components/ui/sidebar";
import { useDialogOpener } from "../providers/Dialog/hooks";
import KubeConfigPreviewDialog from "./KubeConfigPreview";
import NamespacesDialog from "./Namespaces";

export function ClusterSwitcher({
  clusters,
}: {
  clusters: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [activeCluster] = React.useState(clusters[0]);

  const openNamespacesDialog = useDialogOpener(NamespacesDialog);
  const openKubeConfigPreviewDialog = useDialogOpener(KubeConfigPreviewDialog);

  if (!activeCluster) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg2"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="text-sidebar-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeCluster.logo className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCluster.name}</span>
                <span className="truncate text-xs">{activeCluster.plan}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="flex items-center gap-2 p-0 font-normal">
              <div className="text-sidebar-primary flex aspect-square size-8 items-center justify-center rounded-lg">
                <activeCluster.logo className="size-6" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeCluster.name}</span>
                <span className="truncate text-xs">{activeCluster.plan}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  openNamespacesDialog({});
                }}
              >
                <Shield className="size-4" />
                <div className="flex items-center gap-3">Namespaces</div>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => {
                  openKubeConfigPreviewDialog({});
                }}
              >
                <FileUser className="size-4" />
                <div className="flex items-center gap-3">Kubeconfig</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
