import { useLocation, useNavigate, useParams } from "@tanstack/react-router";
import { Boxes } from "lucide-react";
import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { ClusterSwitcher } from "./cluster-switcher";
import { NavUser } from "./nav-user";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { useSidebar } from "./ui/sidebar";
import { cn } from "../utils/classname";
import { useClusterStore } from "../../k8s/store";
import { createNavigationConfig } from "./sidebar/navigationConfig";
import { SidebarNavGroup } from "./sidebar/SidebarNavGroup";
import { SidebarPinnedSection } from "./sidebar/SidebarPinnedSection";
import { ModeSwitcher } from "./sidebar/ModeSwitcher";
import { modeFromPath, type Mode } from "./sidebar/ModeSwitcher/mode";
import { K8sSidebar } from "@/modules/k8s/components/K8sSidebar";
import { FactorySidebar } from "@/modules/agent-substrate/components/FactorySidebar";
import { useHasRole } from "@/core/auth/useHasRole";

const SIDEBAR_WIDTH_MOBILE = "18rem";

/**
 * Main application sidebar component
 * Supports both mobile and desktop layouts with collapsible menu groups
 */
export function AppSidebar() {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const navigate = useNavigate();
  const location = useLocation();
  const { clusterName: paramClusterName } = useParams({ strict: false }) as { clusterName?: string };
  const activeClusterName = paramClusterName ?? clusterName;

  const mode = modeFromPath(location.pathname, activeClusterName);

  const handleModeSelect = (next: Mode) => {
    if (!activeClusterName) return;
    const params = { clusterName: activeClusterName };
    if (next === "krci") {
      navigate({ to: "/c/$clusterName", params });
    } else {
      navigate({ to: `/c/$clusterName/${next}/overview`, params });
    }
  };

  const clusters = useMemo(
    () => [
      {
        name: clusterName,
        logo: Boxes,
        plan: "Cluster",
      },
    ],
    [clusterName]
  );

  const isAdmin = useHasRole("administrator");
  const nav = useMemo(
    () => createNavigationConfig(clusterName, defaultNamespace, isAdmin),
    [clusterName, defaultNamespace, isAdmin]
  );

  const isMinimized = state === "collapsed";

  const renderModeNav = () => {
    if (mode === "k8s") return <K8sSidebar isMinimized={isMinimized} />;
    if (mode === "factory") return <FactorySidebar isMinimized={isMinimized} />;
    return <SidebarNavGroup label="Platform" nav={nav} isMinimized={isMinimized} />;
  };

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-card text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side="left"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">
            <div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2")}>
              <ClusterSwitcher clusters={clusters} />
              <div className="px-2 py-1">
                <ModeSwitcher mode={mode} onSelect={handleModeSelect} />
              </div>
            </div>
            <div
              data-slot="sidebar-content"
              data-sidebar="content"
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden"
              )}
            >
              <SidebarPinnedSection />
              {renderModeNav()}
            </div>
            <div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2")}>
              <NavUser />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={isMinimized ? "icon" : ""}
      data-variant="sidebar"
      data-side="left"
      data-slot="sidebar"
    >
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[side=right]:rotate-180",
          "group-data-[collapsible=icon]:w-(--sidebar-width-icon)"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 top-(--header-height) left-0 z-10 hidden !h-[calc(100svh-var(--header-height))] w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear group-data-[collapsible=icon]:w-(--sidebar-width-icon) md:flex"
        )}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-card group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col border-r group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          <div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2")}>
            <ClusterSwitcher clusters={clusters} />
            <div className="px-2 py-1 group-data-[collapsible=icon]:px-0">
              <ModeSwitcher mode={mode} onSelect={handleModeSelect} isMinimized={isMinimized} />
            </div>
          </div>
          <SidebarPinnedSection />
          <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden"
            )}
          >
            {renderModeNav()}
          </div>
          <div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2")}>
            <NavUser />
          </div>
        </div>
      </div>
    </div>
  );
}
