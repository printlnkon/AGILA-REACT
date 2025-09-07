export default function TeacherDashboard() {
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {/* card 1 */}
          <div className="bg-muted/80 aspect-video rounded-xl">
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">Content 1</span>
            </div>
          </div>
          {/* card 2 */}
          <div className="bg-muted/80 aspect-video rounded-xl">
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">Content 2</span>
            </div>
          </div>
          {/* card 3*/}
          <div className="bg-muted/80 aspect-video rounded-xl">
            <div className="flex h-full items-center justify-center">
              <span className="text-muted-foreground">Content 3</span>
            </div>
          </div>
        </div>
        <div className="bg-muted/80 min-h-[100vh] flex-1 rounded-xl md:min-h-min">
          <div className="flex h-full items-center justify-center">
            <span className="text-muted-foreground">Main Content Area</span>
          </div>
        </div>
      </div>
    </>
  );
}
