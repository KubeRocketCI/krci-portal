"use client";

import { ChevronRight } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/core/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { NavItem } from "./sidebar/types";

export function NavMain({
  items,
  setActiveSubMenu,
}: {
  items: NavItem[];
  setActiveSubMenu: React.Dispatch<React.SetStateAction<NavItem | null>>;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={item.title} className="p-2">
              <Link
                to={item.route?.to || "/"}
                params={item.route?.params}
                onMouseOver={() => {
                  if (item.children) {
                    setActiveSubMenu(item);
                  }
                }}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {item.children && (
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
