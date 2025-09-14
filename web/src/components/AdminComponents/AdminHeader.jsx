import React from "react";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/utils/ThemeToggle";
import { ThemeToggleDropdown } from "@/utils/ThemeToggleDropdown";
import { CalendarDays, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useAuth } from "@/context/AuthContext";
import AdminNotifications from "@/components/AdminComponents/AdminNotifications";

export default function AdminHeader() {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  // current day and time
  useEffect(() => {
    // set up an interval to update the time every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // clean up the interval when the component unmounts
    return () => {
      clearInterval(timer);
    };
  }, []);

  // filter out empty strings from the path, and also the base 'admin' path
  const pathnames = location.pathname
    .split("/")
    .filter((x) => x && x !== "admin");

  const customBreadcrumbNames = {
    // admin paths
    classes: "Classes",
    "academic-year-semester": "School Year & Semester",
    "department-course": "Department & Course",
    "year-level-section": "Year Level & Section",
    subject: "Subjects",
    "schedule": "Schedule",
    "room": "Room",
    "staff": "Staff",
    "accounts": "Accounts",
    "academic-heads": "Academic Heads",
    "program-heads": "Program Heads",
    "teachers": "Teachers",
    "students": "Students",
    "archives": "Archives",
  };

  const viewProfileBreadcrumbs = {
    "classes": "Class List",
    "academic-heads": "Academic Head Profile",
    "program-heads": "Program Head Profile",
    "students": "Student Profile",
    "teachers": "Teacher Profile",
  };

  // function to capitalize the first letter
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <Card className="sticky top-2 p-0 z-10">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />

          {/* desktop breadcrumbs (hidden on small screens) */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathnames.length > 0 && <BreadcrumbSeparator />}
              {pathnames.map((value, index) => {
                const isLast = index === pathnames.length - 1;
                // reconstruct the path up to the current item
                const to = `/admin/${pathnames.slice(0, index + 1).join("/")}`;

                let name;
                // check if the previous path segment indicates a profile view
                if (isLast && viewProfileBreadcrumbs[pathnames[index - 1]]) {
                  name = viewProfileBreadcrumbs[pathnames[index - 1]];
                } else {
                  // otherwise, use the custom name or capitalize the path value
                  name =
                    customBreadcrumbNames[value] ||
                    capitalize(value.replace(/-/g, " "));
                }

                return (
                  <React.Fragment key={to}>
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{name}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={to}>{name}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {!isLast && <BreadcrumbSeparator />}
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>

          {/* mobile breadcrumbs (visible only on small screens) */}
          <div className="flex items-center gap-1 md:hidden">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/admin">Home</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {pathnames.length > 1 && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>...</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
                {pathnames.length > 0 && (
                  <>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage>
                        {(() => {
                          const lastValue = pathnames[pathnames.length - 1];
                          const secondLastValue =
                            pathnames[pathnames.length - 2];
                          if (viewProfileBreadcrumbs[secondLastValue]) {
                            return viewProfileBreadcrumbs[secondLastValue];
                          }
                          return (
                            customBreadcrumbNames[lastValue] ||
                            capitalize(lastValue.replace(/-/g, " "))
                          );
                        })()}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* current day and time */}
          <div className="hidden sm:flex">
            <Badge
              variant="outline"
              className="flex items-center gap-3 py-1.5 px-3 text-muted-foreground font-semibold"
            >
              {/* day */}
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                <span>
                  {currentTime.toLocaleDateString(undefined, {
                    weekday: "long",
                  })}
                </span>
              </div>

              <Separator orientation="vertical" className="h-4" />

              {/* time */}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>
                  {currentTime.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </Badge>
          </div>

          {/* notifications - only for admin */}
          {currentUser?.role === "admin" && (
            <AdminNotifications currentUser={currentUser} />
          )}

          {/* show different theme toggles based on screen size */}
          <div className="hidden sm:flex items-center gap-2">
            <ThemeToggleDropdown /> <ThemeToggle />
          </div>

          {/* show theme toggle only on small screens */}
          <div className="flex sm:hidden items-center">
            <ThemeToggle />
          </div>
        </div>
      </header>
    </Card>
  );
}
