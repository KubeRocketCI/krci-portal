import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "../ui/sidebar";
import { ResourceQuotas } from "../ResourceQuotas";
import { ThemeSwitcher } from "../ThemeSwitcher";
import { PATH_HOME_FULL } from "@/modules/home/pages/home/route";

function Header() {
  return (
    <div className="fixed top-0 z-20 flex h-(--header-height) w-full items-center gap-6 bg-(--primary-dark) px-2.5 py-2.5">
      <SidebarTrigger className="mr-2.5 text-white [&_svg:not([class*='size-'])]:size-5" />
      <Link to={PATH_HOME_FULL} className="h-full py-1.5">
        <img src="/krci-logo-with-text.svg" alt="kuberocket-ci-logo" className="h-full w-full cursor-pointer" />
      </Link>
      <div className="ml-auto flex items-center gap-2">
        <ThemeSwitcher />
        <ResourceQuotas />
      </div>
    </div>
  );
}

export default Header;
