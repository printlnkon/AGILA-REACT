import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import SideBar from "@/components/AdminComponents/SideBar";
import Header from "@/components/AdminComponents/Header";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeProvider";

export default function Admin() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          {/* sidebar */}
          <SideBar />
          <SidebarInset>
            <SidebarTrigger className="md:hidden" />
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
