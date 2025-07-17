import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useLocation, Link } from "react-router-dom";
import React from "react";
import { ThemeToggle } from "@/utils/ThemeToggle";

export default function Header() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const customBreadcrumbNames = {
    // admin paths
    "academic-year": "Academic Year",
    "semester": "Semester",
    "accounts": "Accounts",
    "archives": "Archives",
    "departments": "Departments",
    "year-level": "Year Level",
    "section": "Section",
    "course-section": "Course and Section",
    "academic-heads": "Academic Head",
    "program-heads": "Program Head",
    "teachers": "Teachers",
    "students": "Students",
  };

  // A simple function to capitalize the first letter.
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // This condition ensures a separator only appears if there's more than just the base 'admin' path.
  const showInitialSeparator = pathnames.length > 1;

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
      <div className="flex items-center gap-2 px-3">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6"  />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/admin">Home</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {showInitialSeparator && <BreadcrumbSeparator />}
            {pathnames.map((value, index) => {
              // The last part of the path is the current page.
              const isLast = index === pathnames.length - 1;
              // Create the path for the link.
              const to = `/${pathnames.slice(0, index + 1).join("/")}`;
              const name = customBreadcrumbNames[value] || capitalize(value.replace(/-/g, " "));

              // Don't render the 'admin' path segment itself, as 'Home' covers it.
              if (value.toLowerCase() === "admin" && index === 0) {
                return null;
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
      </div>
        <div className="flex items-center gap-2 pr-3">
          <ThemeToggle />
        </div>
    </header>
  );
}
