import ErrorMessage from "@/utils/ErrorMessage";
import SideBar from "@/components/AdminDashboard/SideBar";
import Header from "@/components/AdminDashboard/Header";
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
