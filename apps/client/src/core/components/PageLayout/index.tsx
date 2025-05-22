import { AppSidebar } from "../app-sidebar";
import { SidebarInset } from "../ui/sidebar";
import Header from "../Header";
import { Outlet } from "@tanstack/react-router";

function ContentLayout() {
  return (
    <>
      <Header />
      <div className="flex flex-1">
        <AppSidebar />
        <SidebarInset className="bg-background pt-(--header-height)">
          <div className="px-6 pt-10">
            <Outlet />
          </div>
        </SidebarInset>
      </div>
    </>
  );
}

export default ContentLayout;
