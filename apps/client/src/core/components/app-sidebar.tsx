import { RouteParams } from "@/core/router/types";
import { Link } from "@tanstack/react-router";
import {
  Bot,
  Boxes,
  ChevronRight,
  Layers,
  LucideProps,
  PanelsTopLeft,
  Rows2,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { cn } from "../lib/utils";
import { ClusterSwitcher } from "./cluster-switcher";
import { NavUser } from "./nav-user";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import { routeOverviewDetails } from "@/modules/platform/overview/pages/details/route";
import { useClusterStore } from "../store";
import { useShallow } from "zustand/react/shallow";
import { routeComponentList } from "@/modules/platform/codebases/pages/list/route";

export type NavItem = {
  title: string;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
  route?: RouteParams;
  isActive?: boolean;
  children?: NavItem[];
};

const createNav = (clusterName: string, namespace: string): NavItem[] =>
  [
    {
      title: "Overview",
      icon: PanelsTopLeft,
      route: {
        to: routeOverviewDetails.fullPath,
        params: {
          clusterName,
          namespace,
        },
      },
    },
    {
      title: "Pipelines",
      icon: Bot,
      route: {
        to: "/home",
      },
      children: [
        {
          title: "PipelineRuns",
          route: {
            to: "/home",
          },
        },
        {
          title: "Pipelines",
          route: {
            to: "/home",
          },
        },
        {
          title: "Tasks",
          route: {
            to: "/home",
          },
        },
      ],
    },
    {
      title: "Marketplace",
      icon: ShoppingCart,
      route: {
        to: "/home",
      },
    },
    {
      title: "Components",
      icon: Layers,
      route: {
        to: routeComponentList.fullPath,
        params: {
          clusterName,
          namespace,
        },
      },
    },
    {
      title: "Deployment Flows",
      icon: Rows2,
      route: {
        to: "/home",
      },
    },
    {
      title: "Configuration",
      icon: Settings,
      route: {
        to: "/home",
      },
      isActive: true,
      children: [
        {
          title: "Quick Access",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "QuickLinks",
              route: {
                to: "/home",
              },
            },
          ],
        },
        {
          title: "Artifacts Storage",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "Nexus",
              route: {
                to: "/home",
              },
            },
            {
              title: "Registry",
              route: {
                to: "/home",
              },
            },
          ],
        },
        {
          title: "Deployment",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "Clusters",
              route: {
                to: "/home",
              },
            },
            {
              title: "GitOps",
              route: {
                to: "/home",
              },
            },
            {
              title: "ArgoCD",
              route: {
                to: "/home",
              },
            },
          ],
        },
        {
          title: "Security",
          route: {
            to: "/home",
          },
          isActive: true,
          children: [
            {
              title: "DefectDojo",
              route: {
                to: "/home",
              },
            },
            {
              title: "DependencyTrack",
              route: {
                to: "/home",
              },
              isActive: true,
            },
          ],
        },
        {
          title: "Code Quality",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "SonarQube",
              route: {
                to: "/home",
              },
            },
          ],
        },
        {
          title: "VCS",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "Git Servers",
              route: {
                to: "/home",
              },
            },
          ],
        },
        {
          title: "Management Tool",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "Jira",
              route: {
                to: "/home",
              },
            },
          ],
        },
        {
          title: "Gen AI",
          route: {
            to: "/home",
          },
          children: [
            {
              title: "Chat Assistant",
              route: {
                to: "/home",
              },
            },
            {
              title: "Codemie",
              route: {
                to: "/home",
              },
            },
          ],
        },
      ],
    },
  ] as const satisfies NavItem[];

const clusters = [
  {
    name: "eks-sandbox",
    logo: Boxes,
    plan: "Cluster",
  },
];
const SIDEBAR_WIDTH_MOBILE = "18rem";

export function AppSidebar() {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();

  const { clusterName, defaultNamespace } = useClusterStore(
    useShallow((state) => ({
      clusterName: state.clusterName,
      defaultNamespace: state.defaultNamespace,
    }))
  );

  const nav = createNav(clusterName, defaultNamespace);

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
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
            </div>
            <div
              data-slot="sidebar-content"
              data-sidebar="content"
              className={cn(
                "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden"
              )}
            >
              <SidebarGroup>
                <SidebarGroupLabel>Platform</SidebarGroupLabel>
                <SidebarMenu>
                  {nav.map((item) => (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip={item.title} className="p-2" isActive={item?.isActive}>
                        <Link to={item.route?.to || "/"} params={item.route?.params}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item?.children && (
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
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
      data-collapsible={state === "collapsed" ? "icon" : ""}
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
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col border-r group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          <div data-slot="sidebar-header" data-sidebar="header" className={cn("flex flex-col gap-2 p-2")}>
            <ClusterSwitcher clusters={clusters} />
          </div>
          <div
            data-slot="sidebar-content"
            data-sidebar="content"
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden"
            )}
          >
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                {nav.map((item) => (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={item.title} className="p-2">
                      <Link
                        to={item.route?.to || "/"}
                        params={item.route?.params}
                        activeProps={{
                          className: "text-accent-foreground border-l-2 border-primary bg-sidebar-accent",
                        }}
                      >
                        {({ isActive }) => (
                          <>
                            {item.icon && (
                              <item.icon className={cn(isActive ? "text-primary" : "text-sidebar-foreground")} />
                            )}
                            <span className={cn(isActive ? "text-primary" : "text-sidebar-foreground")}>
                              {item.title}
                            </span>
                            {item.children && (
                              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            )}
                          </>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </div>
          <div data-slot="sidebar-footer" data-sidebar="footer" className={cn("flex flex-col gap-2 p-2")}>
            <NavUser />
          </div>
        </div>
      </div>
    </div>
  );
}
