import { Search } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { Label } from "@/components/ui/label";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarInput,
} from "@/components/ui/sidebar";

export function SearchForm() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <form>
      <SidebarGroup className="py-0 mt-2">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>

          {isCollapsed ? (
            <div className="flex justify-center">
              <Search className="size-4 opacity-50" />
            </div>
          ) : (
            <>
              <SidebarInput
                id="search"
                placeholder="Search..."
                className="pl-8"
              />
              <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
            </>
          )}
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  );
}
