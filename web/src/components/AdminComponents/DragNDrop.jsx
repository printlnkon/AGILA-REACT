import { useDropzone } from "react-dropzone";
import { FileIcon } from "lucide-react";

export default function DragNDrop({ onDrop }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // .xlsx and .xls lang pwede
    accept: { 
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
    },
    multiple: false, // ensure only one file is accepted
  });

return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg flex flex-col gap-1 p-6 items-center transition-colors cursor-pointer ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-200"
      }`}
    >
      <input {...getInputProps()} />
      <FileIcon className="w-12 h-12" />
      <span className="text-sm font-medium text-gray-500">
        {isDragActive
          ? "Drop the file here ..."
          : "Drag and drop a file or click to browse"}
      </span>
      <span className="text-xs text-gray-500">.xlsx or .xls format only</span>
    </div>
  );
}
