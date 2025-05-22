import { Outlet } from "@tanstack/react-router";
import { SidebarProvider } from "../../components/ui/sidebar";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export default function Root() {
  const localStorageDefaultOpen = JSON.parse(localStorage.getItem("sidebar_open") || "false");

  return (
    <>
      <div className="w-full [--header-height:calc(theme(spacing.14))]">
        <SidebarProvider defaultOpen={localStorageDefaultOpen} className="flex flex-col">
          <Outlet />
        </SidebarProvider>
      </div>
      {/* <TanStackRouterDevtools /> */}
    </>
  );
}
