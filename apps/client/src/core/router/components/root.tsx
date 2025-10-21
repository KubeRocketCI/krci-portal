import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { SidebarProvider } from "../../components/ui/sidebar";
import { DialogContextProvider } from "@/core/providers/Dialog/provider";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export default function Root() {
  const localStorageDefaultOpen = JSON.parse(localStorage.getItem("sidebar_open") || "false");

  return (
    <DialogContextProvider>
      <HeadContent />
      <div className="w-full [--header-height:calc(theme(spacing.14))]">
        <SidebarProvider defaultOpen={localStorageDefaultOpen} className="flex flex-col">
          <Outlet />
        </SidebarProvider>
      </div>
      <Toaster position="top-right" offset="80px" />
      <Scripts />
      {/* <TanStackRouterDevtools /> */}
    </DialogContextProvider>
  );
}
