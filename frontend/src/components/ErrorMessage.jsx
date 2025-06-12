import React from "react";

function ErrorMessage() {
    return (
        <div className="bg-red-200 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> Something went wrong.</span>
        </div>
    )
}

export default ErrorMessage;