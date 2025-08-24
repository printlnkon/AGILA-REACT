import SideBar from "@/components/TeacherComponents/SideBar";
import Header from "@/components/TeacherComponents/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Outlet } from "react-router-dom";

export default function Teacher() {
    return (
    <>
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
    </>
  );
}
