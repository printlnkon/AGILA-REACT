import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeProvider";
import SideBar from "@/components/AcademicHeadComponents/SideBar";
import Header from "@/components/AcademicHeadComponents/Header";

export default function AcademicHead() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          {/* sidebar for the academic head */}
          <SideBar />
          <SidebarInset>
            {/* header/breadcrumbs for the academic head */}
            <Header />
            {/* main content */}
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </>
  );
}
