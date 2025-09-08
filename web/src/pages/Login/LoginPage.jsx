import { useState, useEffect } from "react";
import { House, AlertTriangle, LoaderCircle, Mail, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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
      const userRole = await login(email, password);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

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
          navigate("/program-head");
          break;
        case "academic_head":
          navigate("/academic-head");
          break;
        default:
          navigate("/");
      }
    } catch (error) {
      setLoginError("Invalid email or password.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Return to home button */}
      <div className="absolute top-6 left-6">
        <Link
          to="/"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-blue-900 shadow-sm transition-all duration-200 group"
          aria-label="Return to Index"
        >
          <House size={18} />
          <span className="font-medium">Home</span>
        </Link>
      </div>

      {/* Main content */}
      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Card header with visual element */}
            <div className="h-16 bg-gradient-to-r from-blue-800 to-blue-900 relative">
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                <div className="bg-white rounded-full p-2 shadow-md">
                  <div className="bg-blue-900 rounded-full p-3">
                    <img
                      src="/assets/images/eagle_head_black.svg"
                      alt="AGILA"
                      className="h-8 w-8 invert"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form content */}
            <div className="px-8 pt-16 pb-8">
              <h1 className="text-2xl font-bold text-center mb-1 text-blue-900">
                Welcome Back!
              </h1>
              <p className="text-gray-600 text-center mb-8">
                Sign in to access your account
              </p>

              {loginError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 flex items-center">
                  <AlertTriangle className="text-red-500 mr-3 flex-shrink-0" />
                  <div className="text-sm">{loginError}</div>
                </div>
              )}

              {/* Login form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Email */}
                <div className="relative">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      type="password"
                      id="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Remember me */}
                <div className="flex items-center">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember-me"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 accent-blue-900 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="remember-me"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Remember me
                    </label>
                  </div>
                </div>

                {/* Login button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer bg-blue-900 hover:bg-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 shadow-sm hover:shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transform hover:-translate-y-0.5"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <LoaderCircle className="animate-spin h-5 w-5 mr-2" />
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-4 text-center text-sm text-gray-600">
        © {new Date().getFullYear()} AGILA. All rights reserved.
      </div>
    </div>
  );
}
