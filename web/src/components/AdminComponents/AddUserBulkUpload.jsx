import { useState, useRef } from "react";
import { 
    Dialog, 
    DialogTrigger, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogClose 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { db, auth } from "@/api/firebase";
import { 
    doc, 
    setDoc, 
    serverTimestamp 
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { format } from "date-fns";

export default function AddUserBulkUpload({ role = "student", onUserAdded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const requiredHeaders = [
    "First Name",
    "Last Name",
    "Gender",
    "Date of Birth",
    "Department"
  ];

  const validateHeaders = (headers) => {
    return requiredHeaders.every((h) => headers.includes(h));
  };

  const generateID = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
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
        if (!row["First Name"] || row["First Name"].length < 2) errors.push("Invalid First Name");
        if (!row["Last Name"] || row["Last Name"].length < 2) errors.push("Invalid Last Name");

        // gender validation
        const genderInput = row["Gender"]?.toLowerCase();
        if (!genderInput || !["male", "female"].includes(genderInput)) {
          errors.push("Gender must be Male or Female");
        }

        // date of birth validation
        const dob = row["Date of Birth"];
        let formattedDOB = "";
        let isValidDate = false;

        let parsedDOB = typeof dob === "string" || typeof dob === "number"
          ? new Date(dob)
          : dob instanceof Date
            ? dob
            : null;

        if (parsedDOB instanceof Date && !isNaN(parsedDOB)) {
          formattedDOB = format(parsedDOB, "yyyy-MM-dd");
          isValidDate = true;
        }

        if (!dob || !isValidDate) {
          errors.push("Date of Birth must be a valid date with complete month, day, and year");
        }

        // department validation
        const validDepartments = ["information technology", "computer science", "computer engineering"];
        const department = row["Department"]?.toLowerCase();
        if (!department || !validDepartments.includes(department)) {
          errors.push("Department must be one of: Information Technology, Computer Science, or Computer Engineering");
        }

        if (errors.length > 0) {
          await new Promise((resolve) => {
            toast.warning(`Row ${index + 2} skipped:\n• ${errors.join("\n• ")}`);
            setTimeout(resolve, 1000); // 1 second delay
          });
          continue;
        }

        try {
          const generatedID = generateID();
          const isStudent = role === "student";
          const email = `${row["Last Name"].toLowerCase().replace(/\s+/g, "")}.${generatedID}@caloocan.sti.edu.ph`;
          const password = `@${row["Last Name"].charAt(0).toUpperCase()}${row["Last Name"].slice(1)}.${format(new Date(formattedDOB), "yyyyddMM")}`;

          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
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
          toast.success(`Row ${index + 2}: Account created for ${row["First Name"]} ${row["Last Name"]}`);
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
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // clear the input 
      }
      if (typeof onUserAdded === "function") {
        onUserAdded();
      }
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Bulk Upload
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload {role.replace("_", " ")}s in Bulk</DialogTitle>
            <DialogDescription>
              Upload an Excel file with {role.replace("_", " ")} account data.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkUpload} className="space-y-4">
            <div>
              <label htmlFor="file-upload" className="block mb-1 font-medium text-sm">
                Upload Excel File
              </label>
              <div className="flex items-center gap-3">
                <input
                 ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  className="block w-full text-sm text-white file:mr-4 file:py-2 file:px-4
                             file:rounded-md file:border-0
                             file:bg-gray-700 file:text-white
                             hover:file:bg-gray-600"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
