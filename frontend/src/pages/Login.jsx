import { House } from "lucide-react";
import { Link } from "react-router-dom";
export default function Login() {
  return (
    <>
      <div className="min-h-screen bg-white font-[Poppins] flex flex-col">
        {/* CENTERED CONTAINER */}
        <div className="flex-grow flex items-center justify-center">
          {/* LOGIN FORM CONTAINER */}
          <div className="max-w-md w-full mx-4 px-6 py-8 bg-white rounded-lg shadow-md">
            {/* HOME ICON HEADER */}
            <div className="flex justify-center mb-3">
              <Link
                to="/"
                className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                aria-label="Return to homepage"
              >
                <House />
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2 text-blue-900">
              Login to your account
            </h1>
            <p className="text-yellow-500 text-center mb-5">
              Enter your email and password below to login
            </p>

            <form className="space-y-6">
              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  placeholder="example@email.com"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* PASSWORD & FORGOT PASSWORD */}
              <div>
                <div className="flex justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <a
                    href="/reset-password"
                    className="text-sm text-blue-900 hover:text-blue-800"
                  >
                    Forgot Password?
                  </a>
                </div>
                <input
                  type="password"
                  id="password"
                  placeholder="Password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* REMEMBER ME */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="remember-me"
                  className="h-4 w-4 text-blue-900 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Remember me
                </label>
              </div>

              {/* LOG IN BUTTON */}
              <button
                type="submit"
                className="w-full bg-blue-900 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200 cursor-pointer"
              >
                Log in
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
