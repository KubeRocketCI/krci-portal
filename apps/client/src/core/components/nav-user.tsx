import {
  BookOpenText,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  MessageSquareMore,
  MessageSquareShare,
  Users,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/core/components/ui/avatar";
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
import { useAuth } from "../auth/provider";
import { Link } from "@tanstack/react-router";
import { EDP_USER_GUIDE } from "../../k8s/constants/docs-urls";

const HELP_MENU_LIST = [
  {
    id: 0,
    label: "Documentation",
    icon: BookOpenText,
    url: EDP_USER_GUIDE.OVERVIEW.url,
  },
  {
    id: 1,
    label: "Join Discussions",
    icon: MessageSquareMore,
    url: "https://github.com/KubeRocketCI/docs/discussions",
  },
  {
    id: 2,
    label: "Open an issue/request",
    icon: MessageSquareShare,
    url: "https://github.com/epam/edp-install/issues/new/choose",
  },
];

export function NavUser() {
  const { isMobile } = useSidebar();

  const { user, logoutMutation } = useAuth();

  const userNameInitials =
    user?.name
      ?.split(" ")
      .map((name) => name.charAt(0).toUpperCase())
      .join("") ?? "CN";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user && <AvatarImage src={user.picture} alt={user.name} />}

                <AvatarFallback className="rounded-lg">{userNameInitials}</AvatarFallback>
              </Avatar>
              {user && (
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              )}
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user && <AvatarImage src={user.picture} alt={user.name} />}
                  <AvatarFallback className="rounded-lg">{userNameInitials}</AvatarFallback>
                </Avatar>
                {user && (
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs">{user.email}</span>
                    {user.groups && user.groups.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        <Users className="text-muted-foreground h-3 w-3" />
                        <span className="text-muted-foreground text-xs">{user.groups.join(", ")}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {HELP_MENU_LIST.map(({ id, url, icon: Icon, label }) => {
                return (
                  <DropdownMenuItem key={id} asChild>
                    <Link to={url} target="_blank" rel="noopener noreferrer" className="w-full cursor-pointer">
                      <span className="flex w-full items-center gap-3">
                        <Icon />
                        <span>{label}</span>
                        <ExternalLink className="ml-auto size-4" />
                      </span>
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation!.mutate()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
