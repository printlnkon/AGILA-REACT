import { useState, useEffect } from "react";
import { AlertTriangle, Info, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useActiveSession } from "@/context/ActiveSessionContext";

export default function ScheduleTable() {
  const { activeSession, loading: sessionLoading } = useActiveSession();
  const isNoActiveSession = !activeSession || !activeSession.id;
  const isNoActiveSemester = activeSession && !activeSession.semesterId;
  return (
    <div className="flex h-full w-full flex-col p-4 space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-red-600">Manage Schedule</h1>
          <p className="text-muted-foreground">
            Manage the schedule for classes, including time slots and room
            assignments.
          </p>
        </div>
      </div>

      {/* active school year and semester */}
      <div className="mb-4">
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            {!isNoActiveSession ? (
              <Info className="h-8 w-8 mt-2 flex-shrink-0 text-ring" />
            ) : (
              <AlertTriangle className="h-8 w-8 mt-2 flex-shrink-0 text-destructive" />
            )}
            <div>
              <p className="font-semibold">
                {!isNoActiveSession
                  ? "Schedules for Active School Year and Semester"
                  : "No Active School Year"}
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
                  Please go to the School Year module and set an active session
                  to manage schedules.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
