import ArchiveTable from "@/components/AdminComponents/ArchiveTable";

export default function Archive() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6">
        <div className="grid auto-rows-min gap-2 sm:gap-4">
          <div className="w-full overflow-x-auto">
            <h1 className="text-lg font-bold text-blue-900">Manage Archive</h1>
            <ArchiveTable className="container min-w-full py-1 sm:py-2"/>
          </div>
        </div>
      </div>
    </>
  );
}