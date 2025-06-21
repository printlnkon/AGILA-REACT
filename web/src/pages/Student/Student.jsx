import SideBar from "@/components/StudentComponents/SideBar";
import Header from "@/components/StudentComponents/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function Student() {
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