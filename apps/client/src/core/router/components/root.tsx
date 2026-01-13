import { DialogContextProvider } from "@/core/providers/Dialog/provider";
import { HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { SidebarProvider } from "../../components/ui/sidebar";
import { K8sRelatedIconsSVGSprite } from "@/core/components/sprites/K8sRelatedIconsSVGSprite";
import { LOCAL_STORAGE_SERVICE } from "@/core/services/local-storage";

export default function Root() {
  const localStorageDefaultOpen = LOCAL_STORAGE_SERVICE.getItem("sidebar_open") ?? true;

  return (
    <DialogContextProvider>
      <HeadContent />
      <div className="w-full">
        <SidebarProvider defaultOpen={localStorageDefaultOpen} className="flex flex-col">
          <Outlet />
        </SidebarProvider>
      </div>
      <Toaster position="top-right" offset="80px" />
      <K8sRelatedIconsSVGSprite />
      <Scripts />
    </DialogContextProvider>
  );
}
