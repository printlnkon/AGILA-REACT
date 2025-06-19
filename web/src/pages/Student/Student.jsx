import SideBar from "@/components/StudentDashboard/SideBar";
import Header from "@/components/StudentDashboard/Header";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

export default function Student() {
    return (
    <>
      <SidebarProvider>
        {/* sidebar */}
        <SideBar />

        <SidebarInset>
          {/* breadcrumbs */}
          <Header />
          {/* main */}
          {/* <Outlet /> */}
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}