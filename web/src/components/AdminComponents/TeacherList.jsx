import { useEffect, useState } from "react";
import { db } from "@/api/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function TeacherList({ department, onTeacherCountChange }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!department || !department.id) {
      setLoading(false);
      return;
    }

    const teachersRef = collection(db, "users/teacher/accounts");
    const q = query(
      teachersRef,
      where("department", "in", [
        department.id,
        department.departmentId,
        department.departmentName,
      ])
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const teachersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTeachers(teachersData);
        if (onTeacherCountChange) onTeacherCountChange(teachersData.length);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching teachers:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [department, onTeacherCountChange]);

  if (loading)
    return <div className="py-4 text-center">Loading teachers...</div>;

  if (teachers.length === 0) {
    return (
      <div className="py-4 text-center text-muted-foreground">
        No teachers assigned to this department
      </div>
    );
  }

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {teachers.map((teacher) => (
          <Card key={teacher.id}>
            <CardHeader className="flex flex-row items-center gap-3">
              <Avatar className="h-9 w-9 sm:h-10 sm:w-10">
                <AvatarImage src={teacher.photoURL} />
                <AvatarFallback>
                  {teacher.firstName.charAt(0)}
                  {teacher.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">
                  {`${teacher.firstName} ${teacher.lastName}`}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate">
                  {teacher.email}
                </CardDescription>
                <Badge className="mt-1 text-xs">
                  Employee No. {teacher.employeeNumber}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
}
