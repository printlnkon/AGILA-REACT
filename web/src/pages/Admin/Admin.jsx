import SideBar from "@/components/AdminComponents/SideBar";
import Header from "@/components/AdminComponents/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function Admin() {
  return (
    <>
      <SidebarProvider>
        {/* sidebar */}
        <SideBar />

        <SidebarInset>
          {/* breadcrumbs */}
          <Header />
          {/* main */}
          <Outlet />
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
