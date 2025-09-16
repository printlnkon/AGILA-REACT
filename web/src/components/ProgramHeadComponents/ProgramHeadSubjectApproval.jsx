import SubjectApproval from "@/components/ProgramHeadComponents/SubjectApproval";

export default function ProgramHeadSubjectApproval() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-2 sm:p-4 lg:p-6">
        <div className="grid auto-rows-min gap-2 sm:gap-4">
          <div className="w-full overflow-x-auto">
            <SubjectApproval />
          </div>
        </div>
      </div>
    </>
  );
}