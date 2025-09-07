import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/context/ThemeProvider";
import SideBar from "@/components/StudentComponents/SideBar";
import Header from "@/components/StudentComponents/Header";

export default function Student() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
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
      </ThemeProvider>
    </>
  );
}
