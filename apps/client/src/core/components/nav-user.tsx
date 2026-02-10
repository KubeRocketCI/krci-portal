import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpenText,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  MessageSquareMore,
  MessageSquareShare,
  Users,
} from "lucide-react";

import { useAuth } from "@/core/auth/provider";
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
import { Tooltip } from "@/core/components/ui/tooltip";
import { EDP_USER_GUIDE } from "@/k8s/constants/docs-urls";

function UserGroups({ groups }: { groups: string[] }) {
  const [expanded, setExpanded] = useState(false);

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }

  return (
    <div className="space-y-1">
      <button type="button" className="flex w-full items-center gap-1" onClick={handleToggle}>
        <Users className="text-muted-foreground h-3 w-3 shrink-0" />
        <span className="text-muted-foreground text-xs">Member of {groups.length} groups</span>
        {expanded ? (
          <ChevronUp className="text-muted-foreground ml-auto h-3 w-3" />
        ) : (
          <ChevronDown className="text-muted-foreground ml-auto h-3 w-3" />
        )}
      </button>
      {expanded && (
        <ul className="max-h-40 space-y-0.5 overflow-y-auto">
          {groups.map((group) => (
            <li key={group}>
              <Tooltip title={group} placement="right">
                <span className="text-muted-foreground block truncate text-xs">{group}</span>
              </Tooltip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const HELP_MENU_LIST = [
  {
    label: "Documentation",
    icon: BookOpenText,
    url: EDP_USER_GUIDE.OVERVIEW.url,
  },
  {
    label: "Join Discussions",
    icon: MessageSquareMore,
    url: "https://github.com/KubeRocketCI/docs/discussions",
  },
  {
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
      .map((name: string) => name.charAt(0).toUpperCase())
      .join("") ?? "CN";

  return (
    <SidebarMenu data-tour="user-nav">
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
            className="w-(--radix-dropdown-menu-trigger-width) max-w-72 min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                  {user && <AvatarImage src={user.picture} alt={user.name} />}
                  <AvatarFallback className="rounded-lg">{userNameInitials}</AvatarFallback>
                </Avatar>
                {user && (
                  <div className="min-w-0 flex-1 leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <div className="truncate text-xs">{user.email}</div>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            {user?.groups && user.groups.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <UserGroups groups={user.groups} />
                </div>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {HELP_MENU_LIST.map(({ url, icon: Icon, label }) => (
                <DropdownMenuItem key={label} asChild>
                  <Link to={url} target="_blank" rel="noopener noreferrer" className="w-full cursor-pointer">
                    <span className="flex w-full items-center gap-3">
                      <Icon />
                      <span>{label}</span>
                      <ExternalLink className="ml-auto size-4" />
                    </span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logoutMutation?.mutate()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
