import {
  LayoutDashboard,
  Settings,
  UsersRound,
  LogOut,
  GalleryVerticalEnd,
  ChevronRight,
  Archive,
  BookOpen,
  ChevronsUpDown,
  Bell,
  Layers,
  Building2,
  BookText,
  LayoutList,
  CalendarDays,
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
  useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchForm } from "@/components/ui/search-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";
import { useState, useEffect, useMemo } from "react";

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
      title: "Classes",
      url: "#",
      items: [
        {
          title: "Classes",
          url: "/admin/classes",
          icon: LayoutList,
        },
      ],
    },
    {
      title: "Academic",
      url: "#",
      items: [
        {
          title: "School Year and Semester",
          url: "/admin/academicYearAndSemester",
          icon: BookOpen,
          // items: [
          //   {
          //     title: "View Academic Years",
          //     url: "/admin/academic-year",
          //     icon: UsersRound,
          //   },
          // ],
        },
        // {
        //   title: "Semester",
        //   url: "/admin/semester",
        //   icon: Calendar,
        //   items: [
        //     {
        //       title: "View Semesters",
        //       url: "/admin/semester",
        //       icon: UsersRound,
        //     },
        //   ],
        // },
        {
          title: "Department and Course",
          url: "/admin/departmentAndCourse",
          icon: Building2,
          // items: [
          //   {
          //     title: "View Courses",
          //     url: "#",
          //     icon: UsersRound,
          //   },
          // ],
        },
        // {
        //   title: "Course",
        //   url: "/admin/course",
        //   icon:  LayoutList,
        //   items: [
        //     {
        //       title: "View Courses",
        //       url: "#",
        //       icon: UsersRound,
        //     },
        //   ],
        // },
        {
          title: "Year Level and Section",
          url: "/admin/yearLevelAndSection",
          icon: Layers,
          // items: [
          //   {
          //     title: "View Courses",
          //     url: "#",
          //     icon: UsersRound,
          //   },
          // ],
        },
        {
          title: "Subject",
          url: "/admin/subject",
          icon: BookText,
          // items: [
          //   {
          //     title: "View Courses",
          //     url: "#",
          //     icon: UsersRound,
          //   },
          // ],
        },
        {
          title: "Schedule",
          url: "/admin/schedule",
          icon: CalendarDays,
          items: [
            {
              title: "Rooms",
              url: "#",
              // icon: UsersRound,
            },
          ],
        },
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
          url: "/admin/accounts",
          icon: UsersRound,
          items: [
            {
              title: "Academic Heads",
              url: "/admin/academic-heads",
              // icon: UsersRound,
            },
            {
              title: "Program Heads",
              url: "/admin/program-heads",
              // icon: UsersRound,
            },
            {
              title: "Teachers",
              url: "/admin/teachers",
              // icon: UsersRound,
            },
            {
              title: "Students",
              url: "/admin/students",
              // icon: UsersRound,
            },
          ],
        },
        {
          title: "Archives",
          url: "/admin/archives",
          icon: Archive,
          // items: [
          //   {
          //     title: "View Archive Users",
          //     url: "#",
          //     icon: UsersRound,
          //   },
          // ],
        },
      ],
    },
  ],
};

export default function SideBar() {
  const { currentUser, logout } = useAuth();

  // sidebar
  const { isMobile, state } = useSidebar();
  const isCollapsed = state === "collapsed";

  // router
  const navigate = useNavigate();
  const location = useLocation();

  // search
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [inputValue]);

  // filtering logic
  const filteredItems = useMemo(() => {
    if (!searchQuery) {
      return items.navMain;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();

    return items.navMain
      .map((category) => {
        const filteredCategoryItems = category.items
          .map((item) => {
            // filter for sub-items
            if (item.items) {
              const filteredSubItems = item.items.filter((subItem) =>
                subItem.title.toLowerCase().includes(lowerCaseQuery)
              );
              if (
                item.title.toLowerCase().includes(lowerCaseQuery) ||
                filteredSubItems.length > 0
              ) {
                // if parent title doesn't match, show matching sub-items
                if (!item.title.toLowerCase().includes(lowerCaseQuery)) {
                  return { ...item, items: filteredSubItems };
                }
                // otherwise, show parent and all sub-items
                return item;
              }
            }
            // For items without sub-items
            if (item.title.toLowerCase().includes(lowerCaseQuery)) {
              return item;
            }
            return null;
          })
          .filter(Boolean); // Remove null entries

        if (filteredCategoryItems.length > 0) {
          return { ...category, items: filteredCategoryItems };
        }
        return null;
      })
      .filter(Boolean); // Remove empty categories
  }, [searchQuery]);

  const getInitials = (firstName = "", lastName = "") => {
    const firstInitial = firstName ? firstName.charAt(0) : "";
    const lastInitial = lastName ? lastName.charAt(0) : "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };

  const userInitials = getInitials(
    currentUser?.firstName,
    currentUser?.lastName
  );

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
    if (searchQuery && menuItem.items) {
      return menuItem.items.some((subItem) =>
        subItem.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

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
                    <span className="font-bold text-muted-background">
                      AGILA
                    </span>
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
          <SearchForm searchQuery={inputValue} setSearchQuery={setInputValue} />
          {filteredItems.map((category) => (
            <SidebarGroup key={category.title}>
              <SidebarGroupLabel>{category.title}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {category.items.map((menuItem) =>
                    menuItem.items ? (
                      // collapsible menu item with sub-items
                      <Collapsible
                        key={menuItem.title}
                        asChild
                        defaultOpen={isMenuExpanded(menuItem)}
                        className="group/collapsible"
                      >
                        {/* main items */}
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            tooltip={isCollapsed ? menuItem.title : undefined}
                            className={`
                                transition-all duration-200 ease-in-out
                                ${
                                  isActive(menuItem.url) ||
                                  menuItem.items.some((subItem) =>
                                    isActive(subItem.url)
                                  )
                                    ? "font-bold bg-sidebar-primary text-white"
                                    : ""
                                }
                                `}
                          >
                            {/* main items */}
                            <Link
                              to={menuItem.url}
                              className="flex items-center flex-grow"
                            >
                              {menuItem.icon && (
                                <menuItem.icon className="mr-2 h-4 w-4 " />
                              )}
                              <span>{menuItem.title}</span>
                            </Link>

                            {/* trigger for sub-items */}
                            <CollapsibleTrigger asChild>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                            </CollapsibleTrigger>
                          </SidebarMenuButton>

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
                                        ? "bg-sidebar-primary text-white font-bold mt-1 mb-2"
                                        : ""
                                    }
                                  `}
                                  >
                                    <Link to={subItem.url}>
                                      {/* icons for sub items */}
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
                      // menu item without sub-items
                      <SidebarMenuItem key={menuItem.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={isCollapsed ? menuItem.title : undefined}
                          className={`
                            transition-all duration-200 ease-in-out
                            ${
                              // make the icon color white
                              isActive(menuItem.url)
                                ? "bg-sidebar-primary text-white font-bold"
                                : ""
                            }
                          `}
                        >
                          <Link to={menuItem.url}>
                            {menuItem.icon && (
                              <menuItem.icon className="h-4 w-4" />
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

        <Separator className="my-2" />

        {/* footer */}
        <SidebarFooter className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          size="lg"
                          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
                        >
                          <Avatar className="h-8 w-8 rounded-lg">
                            <AvatarImage
                              // will be changed once finalized the user creation
                              src={"https://github.com/shadcn.png"}
                              alt={currentUser?.name}
                            />
                            <AvatarFallback className="rounded-lg">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">
                              {currentUser?.name}
                            </span>
                          </div>
                          <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right">
                        <p>Profile</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={"https://github.com/shadcn.png"}
                          alt={currentUser?.name}
                        />
                        <AvatarFallback className="rounded-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      {/* inside the avatar */}
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {currentUser?.name}
                        </span>
                        <span className="truncate text-xs">
                          {currentUser?.email}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer">
                      <Bell />
                      Notifications
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer"
                  >
                    <LogOut />
                    Log out
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
