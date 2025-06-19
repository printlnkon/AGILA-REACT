import {
  Calendar,
  LayoutDashboard,
  Search,
  Settings,
  ChevronUp,
  User2,
  Building,
  LogOut,
  GalleryVerticalEnd,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchForm } from "@/components/ui/search-form";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const items = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        {
          title: "Home",
          url: "/student",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Plaform",
      url: "#",
      items: [
        {
          title: "Attendance",
          url: "#",
          icon: User2,
        },
        {
          title: "Lorem Ipsum",
          url: "#",
          icon: Building,
        },
        {
          title: "Schedule",
          url: "#",
          icon: Calendar,
        },
      ],
    },
  ],
};

export default function SideBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  }

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        {/* header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/student">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-bold text-blue-900">AGILA</span>
                    <span className="">v1.0.0</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* content */}
        <SidebarContent>
          {/* search */}
          <SearchForm />
          {items.navMain.map((category) => (
            <SidebarGroup key={category.title}>
              <SidebarGroupLabel>{category.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((menuItem) => (
                    <SidebarMenuItem key={menuItem.title}>
                      <SidebarMenuButton asChild>
                        <Link to={menuItem.url}>
                          {menuItem.icon && (
                            <menuItem.icon className="mr-2 h-4 w-4" />
                          )}
                          {menuItem.title}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        {/* footer */}
        <SidebarFooter className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton>
                    <User2 /> {currentUser?.firstName || "User"}
                    <ChevronUp className="ml-auto" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <Settings /> <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut /> <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </>
  );
}
