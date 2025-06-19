import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import SpinnerCircle from "@/components/ui/spinner-09";

export default function ProtectedRoute({ children, roles }) {
  const { currentUser, userRole, loading } = useAuth();

  // show loading state habang chinicheck if user is authenticated
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <SpinnerCircle />
      </div>
  }

  // pag walang nadetect na user, rekta login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // if authenticated pero walang role, rekta home page
  if (roles && roles.length > 0 && !roles.includes(userRole)) {
    alert("You do not have permission to access this page.");
    return <Navigate to="/" replace />;
  }

  // if authenticated si user at nadetect yung role niya sa firestore, ire-render niya yung designated content
  return children;
}
