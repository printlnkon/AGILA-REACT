import * as XLSX from "xlsx";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { db, auth } from "@/api/firebase";
import { format } from "date-fns";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import DragNDrop from "@/components/AdminComponents/DragNDrop";

export default function AddUserBulkUpload({ role = "student", onUserAdded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      toast.info(`Selected file: ${selectedFile.name}`);
    } else {
      toast.error("Invalid file type. Please upload a .xlsx or .xls file.");
    }
  }, []);

  const requiredHeaders = [
    "First Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Department",
  ];

  const validateHeaders = (headers) => {
    return requiredHeaders.every((h) => headers.includes(h));
  };

  const generateID = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleBulkUpload = async () => {
    if (!file) return toast.error("Please select a file first.");
    setIsUploading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (!validateHeaders(Object.keys(rows[0] || {}))) {
        toast.error("Excel file headers do not match required format.");
        return;
      }

      for (const [index, row] of rows.entries()) {
        const errors = [];

        // for invalid characters in fn, mn, ln, sfx
        const nameFields = ["First Name", "Middle Name", "Last Name", "Suffix"];
        nameFields.forEach((field) => {
          if (row[field] && /[^a-zA-Z\s]/.test(row[field])) {
            errors.push(`${field} must not contain numbers or symbols`);
          }
        });

        // Required field checks
        if (!row["First Name"] || row["First Name"].length < 2)
          errors.push("Invalid First Name");
        if (!row["Last Name"] || row["Last Name"].length < 2)
          errors.push("Invalid Last Name");

        // gender validation
        const genderInput = row["Gender"]?.toLowerCase();
        if (!genderInput || !["male", "female"].includes(genderInput)) {
          errors.push("Gender must be Male or Female");
        }

        // date of birth validation
        const dob = row["Date of Birth"];
        let formattedDOB = "";
        let isValidDate = false;

        let parsedDOB =
          typeof dob === "string" || typeof dob === "number"
            ? new Date(dob)
            : dob instanceof Date
            ? dob
            : null;

        if (parsedDOB instanceof Date && !isNaN(parsedDOB)) {
          formattedDOB = format(parsedDOB, "yyyy-MM-dd");
          isValidDate = true;
        }

        if (!dob || !isValidDate) {
          errors.push(
            "Date of Birth must be a valid date with complete month, day, and year"
          );
        }

        // department validation
        const validDepartments = [
          "information technology",
          "computer science",
          "computer engineering",
        ];
        const department = row["Department"]?.toLowerCase();
        if (!department || !validDepartments.includes(department)) {
          errors.push(
            "Department must be one of: Information Technology, Computer Science, or Computer Engineering"
          );
        }

        if (errors.length > 0) {
          await new Promise((resolve) => {
            toast.warning(
              `Row ${index + 2} skipped:\n• ${errors.join("\n• ")}`
            );
            setTimeout(resolve, 1000); // 1 second delay
          });
          continue;
        }

        try {
          const generatedID = generateID();
          const isStudent = role === "student";
          const email = `${row["Last Name"]
            .toLowerCase()
            .replace(/\s+/g, "")}.${generatedID}@caloocan.sti.edu.ph`;
          const password = `@${row["Last Name"].charAt(0).toUpperCase()}${row[
            "Last Name"
          ].slice(1)}.${format(new Date(formattedDOB), "yyyyddMM")}`;

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const userId = userCredential.user.uid;

          const userData = {
            [isStudent ? "studentNumber" : "employeeNumber"]: generatedID,
            firstName: row["First Name"].trim(),
            middleName: row["Middle Name"]?.trim() || "",
            lastName: row["Last Name"].trim(),
            suffix: row["Suffix"]?.trim() || "",
            gender: row["Gender"],
            dateOfBirth: formattedDOB,
            email,
            password,
            department: row["Department"],
            role,
            status: "active",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };

          await setDoc(doc(db, `users/${role}/accounts`, userId), userData);
          toast.success(
            `Row ${index + 2}: Account created for ${row["First Name"]} ${
              row["Last Name"]
            }`
          );
        } catch (err) {
          toast.error(`Row ${index + 2} failed: ${err.message}`);
        }
      }
    } catch (error) {
      console.error("Error parsing or processing file:", error);
      toast.error("Failed to process file: " + error.message);
    } finally {
      setIsUploading(false);
      setFile(null);
      if (typeof onUserAdded === "function") {
        onUserAdded();
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button className="flex items-center cursor-pointer gap-2">
            <Upload />
            Bulk Upload
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-xl">
          {/* header */}
          <DialogHeader>
            <DialogTitle>Upload {role.replace("_", " ")}s in Bulk</DialogTitle>
            <DialogDescription>
              Upload an Excel file with {role.replace("_", " ")} account data.
            </DialogDescription>
          </DialogHeader>
          <Card>
            <CardContent className="space-y-4 pt-6">
              {/* drag and drop function */}
              <DragNDrop onDrop={onDrop} />
              {file && (
                <p className=" text-sm text-center text-primary">
                  Selected file: <strong>{file.name}</strong>
                </p>
              )}
            </CardContent>
            {/* cancel and upload btn */}
            <CardFooter className="flex justify-end">
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  className="mr-2 cursor-pointer"
                  disabled={isUploading}
                  onClick={() => setFile(null)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleBulkUpload}
                className="cursor-pointer"
                disabled={isUploading || !file}
              >
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
