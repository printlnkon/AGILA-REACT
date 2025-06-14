import ErrorMessage from "@/components/ErrorMessage";
import SideBar from "@/components/AdminDashboard/SideBar";
import Header from "@/components/AdminDashboard/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function Admin() {
  return (
    <>
      <SidebarProvider>
        {/* sidebar */}
        <ErrorMessage>
          <SideBar />
        </ErrorMessage>

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
