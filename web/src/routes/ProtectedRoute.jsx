import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import SpinnerCircle from "@/components/ui/spinner-09";

export default function ProtectedRoute({ children, roles }) {
  const { currentUser, userRole, loading } = useAuth();

  // show loading state while checking if user is authenticated
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <SpinnerCircle />
      </div>
    );
  }

  // if no user detected, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // if authenticated but doesn't have the required role
  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    alert("You do not have permission to access this page.");
    return <Navigate to="/" replace />;
  }

  // if user is authenticated and has the correct role, render the protected content
  return children;
}
