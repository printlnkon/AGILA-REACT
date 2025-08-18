export default function ScheduleTable() {
    return (
        <div className="flex h-full w-full flex-col p-4 space-y-4">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold bg-red-600">
                        Manage Schedule
                    </h1>
                    <p className="text-muted-foreground">
                        Manage the schedule for classes, including time slots and room assignments.
                    </p>
                </div>
            </div>

            <div className="mb-4">
                {/* <Card>
                    <CardContent className="p-4 flex items-start gap-3">
                        {!isNoActiveSession ? (
                            <Info className="h-8 w-8 mt-2 flex-shrink-0 text-ring" />
                        ) : (
                            <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
                        )}
                        <div>
                            <p className="font-semibold">
                                {!isNoActiveSession
                                    ? "Subjects for Active Academic Year and Semester"
                                    : "No Active Academic Year"}
                            </p>
                            {!isNoActiveSession ? (
                                <p className="text-sm font-bold text-primary">
                                    {activeSession.acadYear} |{" "}
                                    {!isNoActiveSemester
                                        ? activeSession.semesterName
                                        : "No Active Semester"}
                                </p>
                            ) : (
                                <p className="text-sm text-destructive">
                                    Please go to the Academic Year module and set an active
                                    session to manage subjects.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card> */}
            </div>


        </div>
    )
}