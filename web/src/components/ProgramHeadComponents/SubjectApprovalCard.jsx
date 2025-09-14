import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Eye, Clock, Computer } from "lucide-react";

// status badge component
const StatusBadge = ({ status }) => {
  const statusMap = {
    Pending: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock className="h-3 w-3" />,
    },
    Approved: {
      color: "bg-green-100 text-green-800",
      icon: <Check className="h-3 w-3" />,
    },
    Rejected: {
      color: "bg-red-100 text-red-800",
      icon: <X className="h-3 w-3" />,
    },
  };

  const style = statusMap[status] || statusMap["Pending"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style.color}`}
    >
      {style.icon}
      <span className="ml-1">{status}</span>
    </span>
  );
};

export default function SubjectApprovalCard({
  subject,
  isSelected,
  onSelect,
  onViewDetails,
  onApprove,
  onReject,
}) {
  return (
    <Card
      className={`flex flex-col transition-all hover:shadow-lg ${
        isSelected ? "border-primary ring-2 ring-primary" : ""
      }`}
    >
      <CardHeader className="flex-grow">
        <div className="flex items-start justify-between gap-4">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onSelect(subject.id)}
            id={`select-${subject.id}`}
            className="mt-1"
          />

          {/* subject code & name */}
          <div className="flex-1">
            <CardTitle className="flex text-lg justify-between items-start leading-tight">
              <span className="pr-2">
                {subject.subjectCode} - {subject.subjectName}
              </span>
              <StatusBadge status={subject.status} />
            </CardTitle>
          </div>
        </div>

        {/* year level, department name, and units */}
        <div className="flex flex-wrap pl-8 gap-2">
          <Badge variant="secondary">
            {subject.units ? `${subject.units} Units` : "N/A Units"}
          </Badge>
          {/* conditionally render a badge if the subject has a laboratory */}
          {subject.withLaboratory && (
            <Badge variant="secondary" className="border-sky-500 text-sky-600">
              <Computer className="h-3 w-3 mr-1" />
              w/ Laboratory
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3 pl-8">
          <Badge variant="secondary">{subject.yearLevelName || "N/A"}</Badge>
          <Badge variant="secondary">{subject.departmentName || "N/A"}</Badge>
        </div>
      </CardHeader>

      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <Button
          variant="ghost"
          onClick={() => onViewDetails(subject)}
          className="cursor-pointer"
        >
          <Eye className="h-4 w-4" /> Details
        </Button>
        <div className="flex gap-2">
          {subject.status === "Pending" && (
            <>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white cursor-pointer"
                onClick={() => onReject(subject)}
              >
                <X className="h-4 w-4" />
                Reject
              </Button>

              <Button
                className="bg-green-500 hover:bg-green-600 text-white cursor-pointer"
                onClick={() => onApprove(subject)}
              >
                <Check className="h-4 w-4" />
                Approve
              </Button>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
