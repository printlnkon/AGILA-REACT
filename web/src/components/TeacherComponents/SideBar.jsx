import { useState, useEffect, useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { SearchForm } from "@/components/ui/search-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";
import {
  LayoutDashboard,
  Settings,
  LogOut,
  GalleryVerticalEnd,
  ChevronsUpDown,
  Bell,
  User2,
  ClipboardList,
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

// navigation items for the teacher
const items = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        {
          title: "Home",
          url: "/teacher",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "Platform",
      url: "#",
      items: [
        {
          title: "Schedule",
          url: "/teacher/schedule",
          icon: User2,
        },
        {
          title: "Request",
          url: "/teacher/request",
          icon: ClipboardList,
        },
      ],
    },
  ],
};

export default function SideBar() {
  const { currentUser, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);

  // subscribe to teacher profile document (for avatar image/initials)
  useEffect(() => {
    if (!currentUser) return;
    const db = getFirestore();
    const unsub = onSnapshot(
      doc(db, "users", "teacher", "accounts", currentUser.uid),
      (snap) => {
        if (snap.exists()) setProfileData(snap.data());
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
    const timer = setTimeout(() => setSearchQuery(inputValue), 500);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // filtering logic
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items.navMain;

    const q = searchQuery.toLowerCase();
    return items.navMain
      .map((category) => {
        const filteredCategoryItems = category.items
          .map((item) => {
            if (item.items) {
              const filteredSubItems = item.items.filter((sub) =>
                sub.title.toLowerCase().includes(q)
              );
              if (item.title.toLowerCase().includes(q) || filteredSubItems.length > 0) {
                return item.title.toLowerCase().includes(q)
                  ? item
                  : { ...item, items: filteredSubItems };
              }
            }
            if (item.title.toLowerCase().includes(q)) return item;
            return null;
          })
          .filter(Boolean);
        return filteredCategoryItems.length ? { ...category, items: filteredCategoryItems } : null;
      })
      .filter(Boolean);
  }, [searchQuery]);

  // initials helper
  const getInitials = (firstName = "", lastName = "") => {
    const a = firstName ? firstName.charAt(0) : "";
    const b = lastName ? lastName.charAt(0) : "";
    return `${a}${b}`.toUpperCase() || "U";
  };

  const initials = getInitials(
    profileData?.firstName || currentUser?.firstName,
    profileData?.lastName || currentUser?.lastName
  );

  // logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // active route
  const isActive = (url) => {
    if (url === "/teacher") return location.pathname === "/teacher";
    return location.pathname === url || (location.pathname.startsWith(url + "/") && url !== "/teacher");
  };

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        {/* header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/teacher">
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
                        className={`transition-all duration-200 ease-in-out ${
                          isActive(menuItem.url) ? "font-bold bg-sidebar-primary text-white" : ""
                        }`}
                        asChild
                      >
                        <Link to={menuItem.url} className="flex items-center">
                          {menuItem.icon && <menuItem.icon className="h-4 w-4" />}
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
                              alt={initials}
                            />
                            <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                          </Avatar>
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">
                              {profileData?.firstName || currentUser?.firstName}{" "}
                              {profileData?.lastName || currentUser?.lastName}
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
                          alt={initials}
                        />
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {profileData?.firstName || currentUser?.firstName}{" "}
                          {profileData?.lastName || currentUser?.lastName}
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
                      onClick={() => navigate("/teacher/profile")}
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
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
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
