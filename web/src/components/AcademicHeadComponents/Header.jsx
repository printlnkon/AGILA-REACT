import React from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { useLocation, Link } from "react-router-dom";
import { ThemeToggle } from "@/utils/ThemeToggle";
import { ThemeToggleDropdown } from "@/utils/ThemeToggleDropdown";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function Header() {
  const location = useLocation();
  // filter out empty strings from the path, and also the base 'academic-head' path
  const pathnames = location.pathname
    .split("/")
    .filter((x) => x && x !== "academic-head");

  const customBreadcrumbNames = {
    "attendance": "Attendance",
  };

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  // const showInitialSeparator = pathnames.length > 1;

  return (
    <Card className="sticky top-2 p-0 z-10">
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/academic-head">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathnames.length > 0 && <BreadcrumbSeparator />}
              {pathnames.map((value, index) => {
                const isLast = index === pathnames.length - 1;
                // reconstruct the path up to the current item
                const to = `/academic-head/${pathnames
                  .slice(0, index + 1)
                  .join("/")}`;

                const name =
                  customBreadcrumbNames[value] ||
                  capitalize(value.replace(/-/g, " "));

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
                    <Link to="/academic-head">Home</Link>
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
                          if (customBreadcrumbNames[secondLastValue]) {
                            return customBreadcrumbNames[secondLastValue];
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
