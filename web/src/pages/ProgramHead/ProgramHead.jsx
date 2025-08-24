import SideBar from "@/components/ProgramHeadComponents/SideBar";
import Header from "@/components/ProgramHeadComponents/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function ProgramHead() {
    return (
    <>
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
    </>
  );
}
