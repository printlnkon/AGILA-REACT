import { useState, useEffect, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { SearchForm } from "@/components/ui/search-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import Profile from "@/components/StudentComponents/Profile";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  GalleryVerticalEnd,
  ChevronsUpDown,
  Bell,
  User2,
  Building,
  Calendar,
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";

// navigation items for the student
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
      title: "Platform",
      url: "#",
      items: [
        {
          title: "Attendance",
          url: "/student/attendance",
          icon: User2,
        },
        {
          title: "Request",
          url: "/student/request",
          icon: Calendar,
        },
      ],
    },
  ],
};

export default function SideBar() {
  const { currentUser, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;
    const db = getFirestore();
    const unsub = onSnapshot(
      doc(db, "users", "student", "accounts", currentUser.uid),
      (docSnap) => {
        if (docSnap.exists()) {

          setProfileData(docSnap.data());
        }
      }
    );
    return () => unsub();
  }, [currentUser]);

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

  // get user initials
  const getInitials = (firstName = "", lastName = "") => {
    const firstInitial = firstName ? firstName.charAt(0) : "";
    const lastInitial = lastName ? lastName.charAt(0) : "";
    return `${firstInitial}${lastInitial}`.toUpperCase() || "U";
  };

  // get the firstName and lastName
  const userInitials = getInitials(
    profileData?.firstName || currentUser?.firstName,
    profileData?.lastName || currentUser?.lastName
  );

  // function to handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // determine if the menu item is active
  const isActive = (url) => {
    if (url === "/student") {
      return location.pathname === "/student";
    }
    return (
      location.pathname === url ||
      (location.pathname.startsWith(url + "/") && url !== "/student")
    );
  };

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
                  {category.items.map((menuItem) => (
                    <SidebarMenuItem key={menuItem.title}>
                      <SidebarMenuButton
                        tooltip={isCollapsed ? menuItem.title : undefined}
                        className={`
                          transition-all duration-200 ease-in-out
                          ${
                            isActive(menuItem.url)
                              ? "font-bold bg-sidebar-primary text-white"
                              : ""
                          }
                        `}
                        asChild
                      >
                        <Link to={menuItem.url} className="flex items-center">
                          {menuItem.icon && (
                            <menuItem.icon className="h-4 w-4" />
                          )}
                          <span>{menuItem.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
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
                              src={profileData?.profileImage || undefined} 
                              alt={userInitials}
                            />
                            <AvatarFallback className="rounded-lg">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">
                              {currentUser?.firstName} {currentUser?.lastName}
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
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={profileData?.profileImage || undefined}   
                          alt={userInitials}
                        />
                        <AvatarFallback className="rounded-lg">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      {/* inside the avatar */}
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </span>
                        <span className="truncate text-xs">
                          {currentUser?.email || "No email"}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate("/student/profile")}
                    >
                      <User2 />
                      Profile
                    </DropdownMenuItem>
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
