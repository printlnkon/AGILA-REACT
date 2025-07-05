import {
  Calendar,
  LayoutDashboard,
  Settings,
  ChevronUp,
  UsersRound,
  LogOut,
  GalleryVerticalEnd,
  CircleUserRound,
  ChevronRight,
  Archive,
  BookOpen,
  LayoutTemplate,
  LibraryBig,
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { SearchForm } from "@/components/ui/search-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const items = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        {
          title: "Home",
          url: "/admin",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Academic",
      url: "#",
      items: [
        {
          title: "Academic Year",
          url: "#",
          icon: BookOpen,
          items: [
            {
              title: "View Academic Years",
              url: "/admin/academic-year",
              // icon: UsersRound,
            },
          ],
        },
        {
          title: "Semester",
          url: "#",
          icon: UsersRound,
          items: [
            {
              title: "View Semesters",
              url: "/admin/semester",
              // icon: UsersRound,
            },
          ],
        },
        {
          title: "Course",
          url: "#",
          icon: LibraryBig,
          items: [
            {
              title: "View Courses",
              url: "#",
              // icon: UsersRound,
            },
          ],
        },
        {
          title: "Section",
          url: "#",
          icon: LayoutTemplate,
          items: [
            {
              title: "View Sections",
              url: "#",
              // icon: UsersRound,
            },
          ],
        },
        // {
        //   title: "Departments",
        //   url: "/admin/departments",
        //   icon: Building,
        // },
        // {
        //   title: "Schedules",
        //   url: "/admin/schedules",
        //   icon: Calendar,
        // },
      ],
    },
    {
      title: "Accounts",
      url: "#",
      items: [
        {
          title: "Accounts",
          url: "#",
          icon: UsersRound,
          items: [
            {
              title: "View Accounts",
              url: "/admin/accounts",
              // icon: UsersRound,
            },
          ],
        },
        {
          title: "Archives",
          url: "#",
          icon: Archive,
          items: [
            {
              title: "View Archive Users",
              url: "/admin/archives",
              // icon: UsersRound,
            },
          ],
        },
      ],
    },
  ],
};

export default function SideBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const isActive = (url) => {
    if (url === "/admin") {
      return location.pathname === "/admin";
    }
    return (
      location.pathname === url ||
      (location.pathname.startsWith(url + "/") && url !== "/admin")
    );
  };

  const isMenuExpanded = (menuItem) => {
    if (!menuItem.items) return false;
    return menuItem.items.some((subItem) => isActive(subItem.url));
  };

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        {/* header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/admin">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-bold text-muted-background">AGILA</span>
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
                  {category.items.map((menuItem) =>
                    menuItem.items ? (
                      // Render collapsible menu item with sub-items
                      <Collapsible
                        key={menuItem.title}
                        asChild
                        defaultOpen={isMenuExpanded(menuItem)}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          {/* user management */}
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              className={`
                                transition-all duration-200 ease-in-out
                                ${
                                  menuItem.items.some((subItem) =>
                                    isActive(subItem.url)
                                  )
                                    ? "font-medium bg-accent"
                                    : ""
                                }
                              `}
                            >
                              {menuItem.icon && (
                                <menuItem.icon className="mr-2 h-4 w-4 " />
                              )}
                              <span>{menuItem.title}</span>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          {/* sub items */}
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {menuItem.items.map((subItem) => (
                                <SidebarMenuSubItem key={subItem.title}>
                                  <SidebarMenuSubButton
                                    asChild
                                    className={`
                                    transition-all duration-200 ease-in-out
                                    ${
                                      isActive(subItem.url)
                                        ? "bg-blue-900 text-white font-medium"
                                        : ""
                                    }
                                  `}
                                  >
                                    <Link to={subItem.url}>
                                      {/* {subItem.icon && (
                                      <subItem.icon 
                                        color={isActive(subItem.url) ? "white" : "blue-900"} 
                                        className="mr-2 h-3 w-3"
                                      />
                                    )} */}
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    ) : (
                      // Render regular menu item without sub-items
                      <SidebarMenuItem key={menuItem.title}>
                        <SidebarMenuButton
                          asChild
                          className={`
                            transition-all duration-200 ease-in-out
                            ${
                              // make the icon color white
                              isActive(menuItem.url)
                                ? "bg-blue-900 text-white font-medium "
                                : ""
                            }
                          `}
                        >
                          <Link to={menuItem.url}>
                            {menuItem.icon && (
                              <menuItem.icon className="mr-2 h-4 w-4" />
                            )}
                            <span>{menuItem.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  )}
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
                    <CircleUserRound className="mr-2 h-4 w-4" />
                    <span>{currentUser?.firstName || "User"}</span>
                    <ChevronUp className="ml-auto h-4 w-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="top"
                  className="w-[--radix-popper-anchor-width]"
                >
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" /> <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> <span>Sign out</span>
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
