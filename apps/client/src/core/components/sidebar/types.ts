import type { LucideProps } from "lucide-react";
import type { AnyRoute } from "@tanstack/react-router";
import { RouteParams } from "@/core/router/types";

// Base nav item interface
interface BaseNavItem {
  title: string;
  icon?: React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;
}

// Simple nav item with just a route
export interface SimpleNavItem extends BaseNavItem {
  route: RouteParams;
  children?: never;
  defaultRoute?: never;
  groupRoute?: never;
}

// Nav group item with children
export interface NavGroupItem extends BaseNavItem {
  children: (SimpleNavItem | NavSubGroupItem)[];
  defaultRoute?: RouteParams; // Route to navigate to when clicking the group
  groupRoute?: AnyRoute; // Parent route for active state detection of groups
  route?: never;
}

// Sub-group item (second level) that contains simple nav items
export interface NavSubGroupItem {
  title: string;
  children: SimpleNavItem[];
  icon?: never;
  route?: never;
  defaultRoute?: never;
  groupRoute?: never;
}

export type NavItem = SimpleNavItem | NavGroupItem;
