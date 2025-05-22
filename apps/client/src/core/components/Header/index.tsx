import { SidebarTrigger } from "../ui/sidebar";

function Header() {
  return (
    <div className="fixed top-0 z-20 flex h-(--header-height) w-full items-center gap-6 bg-(--primary-dark) px-2.5 py-2.5 shadow-md shadow-gray-500">
      <SidebarTrigger className="mr-2.5 text-white [&_svg:not([class*='size-'])]:size-5" />
      <div className="h-full py-1.5">
        <img src="/krci-logo-with-text.svg" alt="kuberocket-ci-logo" className="h-full w-full" />
      </div>
    </div>
  );
}

export default Header;
