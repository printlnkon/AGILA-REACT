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

// navigation items for the program head
const items = {
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      items: [
        { title: "Home", url: "/program-head", icon: LayoutDashboard },
      ],
    },
    {
      title: "Platform",
      url: "#",
      items: [
        { title: "Schedule", url: "/program-head/schedule", icon: User2 },
        { title: "Request", url: "/program-head/request", icon: ClipboardList },
        { title: "Subject Approval", url: "/program-head/subjectapproval", icon: ClipboardList },
      ],
    },
  ],
};

export default function SideBar() {
  const { currentUser, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);

  // live profile doc for avatar/name
  useEffect(() => {
    if (!currentUser) return;
    const db = getFirestore();
    // Firestore path for program head
    const unsub = onSnapshot(
      doc(db, "users", "programHead", "accounts", currentUser.uid),
      (snap) => snap.exists() && setProfileData(snap.data())
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
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(inputValue), 500);
    return () => clearTimeout(t);
  }, [inputValue]);

  // filter items
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items.navMain;
    const q = searchQuery.toLowerCase();
    return items.navMain
      .map((cat) => {
        const filtered = cat.items
          .map((it) => {
            if (it.items) {
              const sub = it.items.filter((s) => s.title.toLowerCase().includes(q));
              if (it.title.toLowerCase().includes(q) || sub.length) {
                return it.title.toLowerCase().includes(q) ? it : { ...it, items: sub };
              }
            }
            return it.title.toLowerCase().includes(q) ? it : null;
          })
          .filter(Boolean);
        return filtered.length ? { ...cat, items: filtered } : null;
      })
      .filter(Boolean);
  }, [searchQuery]);

  // initials + avatar sources
  const getInitials = (f = "", l = "") => {
    const a = f ? f[0] : "";
    const b = l ? l[0] : "";
    return (a + b || "U").toUpperCase();
  };
  const initials = getInitials(
    profileData?.firstName || currentUser?.firstName,
    profileData?.lastName || currentUser?.lastName
  );
  const avatarUrl = profileData?.profileImage || undefined;

  // logout
  const handleLogout = async () => {
    try { await logout(); navigate("/login"); }
    catch (e) { console.error("Logout failed:", e); alert("Failed to log out. Please try again."); }
  };

  // active route
  const isActive = (url) =>
    url === "/program-head"
      ? location.pathname === "/program-head"
      : location.pathname === url || (location.pathname.startsWith(url + "/") && url !== "/program-head");

  return (
    <>
      <Sidebar variant="floating" collapsible="icon">
        {/* header */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to="/program-head">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <GalleryVerticalEnd className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-bold text-muted-background">AGILA</span>
                    <span>v1.0.0</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* content */}
        <SidebarContent>
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
                            <AvatarImage src={avatarUrl} alt={initials} />
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
                    {isCollapsed && <TooltipContent side="right"><p>Profile</p></TooltipContent>}
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
                        <AvatarImage src={avatarUrl} alt={initials} />
                        <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-medium">
                          {profileData?.firstName || currentUser?.firstName}{" "}
                          {profileData?.lastName || currentUser?.lastName}
                        </span>
                        <span className="truncate text-xs">{currentUser?.email || "No email"}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() => navigate("/program-head/profile")}
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
