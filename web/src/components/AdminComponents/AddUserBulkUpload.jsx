import * as XLSX from "xlsx";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, LoaderCircle } from "lucide-react";
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
import {
  doc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
} from "firebase/firestore";
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
    "Role",
  ];

  const validateHeaders = (headers) => {
    return requiredHeaders.every((h) => headers.includes(h));
  };

  const generateStudentNumber = () => {
    const prefix = "02000";
    const uniquePart = Math.random().toString().slice(2, 8);
    return `${prefix}${uniquePart}`;
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

      const existingUsersSnapshot = await getDocs(
        collection(db, `users/${role}/accounts`)
      );

      const existingNames = new Set();
      existingUsersSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.firstName && data.lastName) {
          existingNames.add(
            `${data.firstName.trim().toLowerCase()} ${data.lastName
              .trim()
              .toLowerCase()}`
          );
        }
      });

      const invalidRoleRows = rows
        .map((row, idx) => {
          const excelRole = row["Role"]?.trim().toLowerCase();
          if (!excelRole || excelRole !== role.toLowerCase()) {
            return `Row ${idx + 2}: "${row["Role"] || "Empty"}"`;
          }
          return null;
        })
        .filter(Boolean);

      if (invalidRoleRows.length > 0) {
        toast.error(
          `Upload failed:\nMismatched roles found:\n• ${invalidRoleRows.join(
            "\n• "
          )}\n\nExpected: "${role.charAt(0).toUpperCase() + role.slice(1)}"`
        );
        return;
      }

      const validatedRows = [];
      const allErrors = [];

      rows.forEach((row, index) => {
        const errors = [];
        const nameFields = ["First Name", "Middle Name", "Last Name", "Suffix"];

        nameFields.forEach((field) => {
          if (row[field] && /[^a-zA-Z\s]/.test(row[field])) {
            errors.push(`${field} must not contain numbers or symbols`);
          }
        });

        if (!row["First Name"] || row["First Name"].length < 2)
          errors.push("Invalid First Name");
        if (!row["Last Name"] || row["Last Name"].length < 2)
          errors.push("Invalid Last Name");

        const genderInput = row["Gender"]?.toLowerCase();
        if (!genderInput || !["male", "female"].includes(genderInput)) {
          errors.push("Gender must be Male or Female");
        }

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

        const fullNameKey = `${row["First Name"].trim().toLowerCase()} ${row[
          "Last Name"
        ]
          .trim()
          .toLowerCase()}`;
        if (existingNames.has(fullNameKey)) {
          errors.push("Account with this full name already exists");
        }

        const roleInput = row["Role"]?.trim().toLowerCase();
        if (!roleInput || roleInput !== role.toLowerCase()) {
          errors.push(`Role mismatch: Expected "${role}"`);
        }

        if (errors.length > 0) {
          allErrors.push(`Row ${index + 2}:\n• ${errors.join("\n• ")}`);
        } else {
          validatedRows.push({ row, formattedDOB });
        }
      });

      if (allErrors.length > 0) {
        toast.error(`Upload failed:\n${allErrors.join("\n\n")}`);
        setIsUploading(false);
        return;
      }

      for (const [index, { row, formattedDOB }] of validatedRows.entries()) {
        try {
          const isStudent = role === "student";
          const studentNumber = isStudent ? generateStudentNumber() : null;
          const employeeNumber = !isStudent ? generateID() : null;

          const email = `${row["Last Name"]
            .toLowerCase()
            .replace(/\s+/g, "")}.${
            isStudent ? studentNumber.slice(-6) : employeeNumber
          }@caloocan.sti.edu.ph`;

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
            [isStudent ? "studentNumber" : "employeeNumber"]: isStudent
              ? studentNumber
              : employeeNumber,
            firstName: row["First Name"].trim(),
            middleName: row["Middle Name"]?.trim() || "",
            lastName: row["Last Name"].trim(),
            suffix: row["Suffix"]?.trim() || "",
            gender: row["Gender"],
            dateOfBirth: formattedDOB,
            email,
            password,
            department: row["Department"],
            role: role.charAt(0).toUpperCase() + role.slice(1).toLowerCase(),
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
          <Button className="flex items-center cursor-pointer">
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
                  className="cursor-pointer"
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
                {/* {isUploading ? "Uploading..." : "Upload"} */}
                {isUploading ? (
                  <>
                    <span className="animate-spin">
                      <LoaderCircle />
                    </span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
