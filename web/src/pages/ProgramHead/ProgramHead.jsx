import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeProvider";
import SideBar from "@/components/ProgramHeadComponents/SideBar";
import Header from "@/components/ProgramHeadComponents/Header";

export default function ProgramHead() {
  return (
    <>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <SidebarProvider>
          {/* sidebar for the program head */}
          <SideBar />
          <SidebarInset>
            {/* header/breadcrumbs for the program head */}
            <Header />
            {/* main content */}
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </ThemeProvider>
    </>
  );
}
