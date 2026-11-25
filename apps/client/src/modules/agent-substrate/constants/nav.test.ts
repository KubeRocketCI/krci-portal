import { describe, expect, it } from "vitest";
import { PAGE_ICONS, getIconTypeFromPath } from "@/core/constants/page-icons";
import { createFactoryNavigationConfig } from "./nav";
import { PATH_FACTORY_AGENT_DETAIL_FULL } from "./paths";

const pinnedIconOf = (path: string | undefined) => {
  const iconType = path === undefined ? undefined : getIconTypeFromPath(path);
  return iconType && PAGE_ICONS[iconType];
};

describe("Factory nav icons", () => {
  const nav = createFactoryNavigationConfig("test-cluster");

  it("gives a pinned Factory nav item the icon of its nav item", () => {
    const pinned = nav.map((item) => ({ title: item.title, icon: pinnedIconOf(item.route?.to) }));

    expect(pinned).toEqual(nav.map(({ title, icon }) => ({ title, icon })));
  });

  it("gives a pinned agent the icon of the Agents nav item", () => {
    expect(pinnedIconOf(PATH_FACTORY_AGENT_DETAIL_FULL)).toBe(nav.find(({ title }) => title === "Agents")!.icon);
  });
});
