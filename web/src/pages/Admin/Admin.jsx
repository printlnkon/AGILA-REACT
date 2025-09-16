import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/context/ThemeProvider";
import SideBar from "@/components/AdminComponents/SideBar";
import AdminHeader from "@/components/AdminComponents/AdminHeader";

export default function Admin() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          {/* sidebar */}
          <SideBar />
          <SidebarInset>
            {/* breadcrumbs */}
            <AdminHeader />
            {/* main */}
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </>
  );
}
