import { createContext, useState, useEffect, useContext } from "react";
import { auth, db } from "@/api/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";

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

      // Store in sessionStorage for session-only access
      sessionStorage.setItem("uid", user.uid);
      sessionStorage.setItem("role", matched.role);
      sessionStorage.setItem("email", matched.email);
      sessionStorage.setItem("name", matched.name);
      sessionStorage.setItem("firstName", matched.firstName);

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
      sessionStorage.removeItem("uid");
      sessionStorage.removeItem("role");
      sessionStorage.removeItem("email");
      sessionStorage.removeItem("name");
      sessionStorage.removeItem("firstName");
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // set up auth state observer
  useEffect(() => {
    setLoading(true);
    let isMounted = true; // to prevent state updates if component unmounts
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // user is signed in
          const role = sessionStorage.getItem("role");
          const email = sessionStorage.getItem("email");
          const name = sessionStorage.getItem("name");
          const firstName = sessionStorage.getItem("firstName");

          if (role && email) {
            if (isMounted) {
              setCurrentUser({
                uid: user.uid,
                email,
                name,
                firstName,
                role,
              });
              setUserRole(role);
            }
            setUserRole(role);
          } else {
            // attempt to find user role if session storage is empty
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
                if (isMounted) {
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

                  // Store in sessionStorage
                  sessionStorage.setItem("uid", user.uid);
                  sessionStorage.setItem("role", r);
                  sessionStorage.setItem("email", userData.email);
                  sessionStorage.setItem("name", userData.name);
                  if (userData.firstName) {
                    sessionStorage.setItem("firstName", userData.firstName);
                  }
                }
                break; // exit loop once found
              }
            }
          }
        } else {
          // user is signed out
          if (isMounted) {
            setCurrentUser(null);
            setUserRole(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Auth state error:", error);
          setCurrentUser(null);
          setUserRole(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    });

    // cleanup subscription
    return () => {
      unsubscribe();
      isMounted = false;
    };
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
