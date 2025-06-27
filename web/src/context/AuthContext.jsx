import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "@/api/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, deleteDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // function to log in a user
  const login = async (email, password) => {
    setError(null);
    try {
      // sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const roles = [
        "admin",
        "student",
        "teacher",
        "program_head",
        "academic_head",
      ];

      // find which role collection contains this user
      let matched = null;
      for (const role of roles) {
        const docRef = doc(db, `users/${role}/accounts`, user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          matched = { ...docSnap.data(), id: docSnap.id, role };
          break;
        }
      }

      if (!matched) {
        throw new Error("User profile not found in Firestore.");
      }

      // store user info in state and session
      setCurrentUser({
        uid: user.uid,
        email: matched.email,
        name: matched.name,
        firstName: matched.firstName,
        role: matched.role,
      });

      setUserRole(matched.role);

      // Store in localStorage instead of sessionStorage for better persistence
      localStorage.setItem("uid", user.uid);
      localStorage.setItem("role", matched.role);
      localStorage.setItem("email", matched.email);
      localStorage.setItem("name", matched.name);
      localStorage.setItem("firstName", matched.firstName);

      return matched.role; // return role for redirect purposes
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // logout function
  const logout = async () => {
    try {
      await auth.signOut();
      alert("You have been logged out successfully.");
      // clear local storage
      localStorage.removeItem("uid");
      localStorage.removeItem("role");
      localStorage.removeItem("email");
      localStorage.removeItem("name");
      localStorage.removeItem("firstName");
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // set up auth state observer
  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // user is signed in
          const role = localStorage.getItem("role");
          const name = localStorage.getItem("name");
          const firstName = localStorage.getItem("firstName");
          const email = localStorage.getItem("email");

          if (role && email) {
            setCurrentUser({
              uid: user.uid,
              email,
              name,
              firstName,
              role,
            });
            setUserRole(role);
          } else {
            // attempt to find user role if local storage is empty
            const roles = [
              "admin",
              "student",
              "teacher",
              "program_head",
              "academic_head",
            ];
            for (const r of roles) {
              const docRef = doc(db, `users/${r}/accounts`, user.uid);
              const docSnap = await getDoc(docRef);
              if (docSnap.exists()) {
                const userData = docSnap.data();
                const userInfo = {
                  uid: user.uid,
                  email: userData.email,
                  name: userData.name,
                  firstName: userData.firstName || "",
                  role: r,
                };
                setCurrentUser(userInfo);
                setUserRole(r);

                // Store in localStorage
                localStorage.setItem("uid", user.uid);
                localStorage.setItem("role", r);
                localStorage.setItem("email", userData.email);
                localStorage.setItem("name", userData.name);
                if (userData.firstName) {
                  localStorage.setItem("firstName", userData.firstName);
                }
                break;
              }
            }
          }
        } else {
          // user is signed out
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error("Auth state error:", error);
        setCurrentUser(null);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    });

    // cleanup subscription
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    error,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
