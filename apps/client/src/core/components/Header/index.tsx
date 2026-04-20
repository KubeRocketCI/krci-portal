import { Link } from "@tanstack/react-router";
import { Plus, Settings } from "lucide-react";
import { SidebarTrigger } from "../ui/sidebar";
import { ResourceQuotas } from "../ResourceQuotas";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { Button } from "../ui/button";
import { useDialogOpener } from "@/core/providers/Dialog/hooks";
import CreateResourceDialog from "../CreateResourceDialog";
import { PATH_HOME_FULL } from "@/modules/home/pages/home/route";
import { PATH_SETTINGS_TOURS_FULL } from "@/modules/tours/pages/settings/route";

function Header() {
  const openCreateResource = useDialogOpener(CreateResourceDialog);

  return (
    <div className="fixed top-0 z-20 flex h-(--header-height) w-full items-center gap-6 bg-(--primary-dark) px-2.5 py-2.5">
      <SidebarTrigger className="mr-2.5 text-white [&_svg:not([class*='size-'])]:size-5" />
      <Link to={PATH_HOME_FULL} className="h-full py-1.5">
        <img src="/krci-logo-with-text.svg" alt="kuberocket-ci-logo" className="h-full w-full cursor-pointer" />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-white hover:bg-white/20 hover:text-white"
          onClick={() => openCreateResource({})}
        >
          <Plus className="h-4 w-4" />
          Create Resource
        </Button>
        {import.meta.env.DEV && (
          <Link to={PATH_SETTINGS_TOURS_FULL}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 hover:text-white">
              <Settings className="h-5 w-5" />
            </Button>
          </Link>
        )}
        <ThemeSwitcher />
        <ResourceQuotas />
      </div>
    </div>
  );
}

export default Header;
