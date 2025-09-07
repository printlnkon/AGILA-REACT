import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeProvider";
import SideBar from "@/components/TeacherComponents/SideBar";
import Header from "@/components/TeacherComponents/Header";
export default function Teacher() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          {/* sidebar for the teacher */}
          <SideBar />
          <SidebarInset>
            {/* header/breadcrumbs for the teacher */}
            <Header />
            {/* main content */}
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </>
  );
}
