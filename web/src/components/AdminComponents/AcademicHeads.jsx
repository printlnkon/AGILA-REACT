import AcademicHeadsTable from "@/components/AdminComponents/AcademicHeadsTable";

export default function AcademicHeads() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6">
        <div className="grid auto-rows-min gap-2 sm:gap-4">
          <div className="w-full overflow-x-auto">
            <AcademicHeadsTable className="container min-w-full py-1 sm:py-2" />
          </div>
        </div>
      </div>
    </>
  );
}
