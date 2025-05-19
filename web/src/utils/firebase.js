import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle login function
export const handleLogin = async (email, password, rememberMe) => {
  try {
    // Sign in with email and password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // You can store the user info or token in localStorage/sessionStorage if needed
    if (rememberMe) {
      localStorage.setItem('user', JSON.stringify(userCredential.user));
    } else {
      sessionStorage.setItem('user', JSON.stringify(userCredential.user));
    }
    
    // Redirect to dashboard or home page after successful login
    window.location.href = '/dashboard'; // or use navigation from React Router
    
    return userCredential.user;
  } catch (error) {
    console.error("Login failed:", error.code, error.message);
    throw error;
  }
};

export default auth;