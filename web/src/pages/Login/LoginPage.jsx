import { useState } from "react";
import { House, AlertTriangle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import SpinnerCircle from "@/components/ui/spinner-09";

export default function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoading(true);

    try {
      console.log("Attempting to log in with:", { email });
      const userRole = await login(email, password);

      // navigate based on user role
      switch (userRole) {
        case "admin":
          navigate("/admin");
          break;
        case "student":
          navigate("/student");
          break;
        case "teacher":
          navigate("/teacher");
          break;
        case "program_head":
          navigate("/program_head");
          break;
        case "academic_head":
          navigate("/academic_head");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      setLoginError("Invalid email or password.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col">
        {/* centered container */}
        <div className="flex-grow flex items-center justify-center">
          {/* login form container */}
          <div className="max-w-md w-full mx-4 px-6 py-8 bg-white rounded-lg shadow-md">
            {/* home icon */}
            <div className="flex justify-center mb-3">
              <Link
                to="/"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                aria-label="Return to Index"
              >
                <House />
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2 text-blue-900">
              Login to your account
            </h1>
            <p className="text-gray-700 text-center mb-5">
              Enter your email and password below to login
            </p>

            {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 flex items-center">
                <AlertTriangle className="text-red-700 mr-2 flex-shrink-0" />
                <div>{loginError}</div>
              </div>
            )}

            {/* login form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  placeholder="example@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* password and forgot password */}
              <div>
                <div className="flex justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="text-sm text-blue-900 hover:text-blue-700"
                  >
                    Forgot Password?
                  </a>
                </div>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                />
              </div>

              {/* remember me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-900 focus:ring-blue-700 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              {/* log in button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-900 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 cursor-pointer disabled:bg-blue-300"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <SpinnerCircle className="h-2 w-2"/>
                    <span>Logging in...</span>
                  </div>
                ) : (
                  "Log in"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
