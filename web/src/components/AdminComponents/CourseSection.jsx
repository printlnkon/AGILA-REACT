import React from "react";
import CourseSectionTable from "@/components/AdminComponents/CourseSectionTable";

function CourseSection() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6">
        <div className="grid auto-rows-min gap-2 sm:gap-4">
          <div className="w-full overflow-x-auto">
            <h1 className="text-2xl font-bold text-blue-900">
              Manage Course and Section
            </h1>
            <CourseSectionTable className="container min-w-full py-1 sm:py-2" />
          </div>
        </div>
      </div>
    </>
  );
}

export default CourseSection;
