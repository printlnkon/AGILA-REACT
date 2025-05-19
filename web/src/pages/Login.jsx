import React, { useState } from 'react';
import { handleLogin } from '@/utils/firebase.js';
// import eagleHeadLogo from '@/assets/images/eagle_head_black.svg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await handleLogin(email, password, rememberMe);
        } catch (error) {
            alert("Login failed. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-[Poppins] flex flex-col">
            {/* NAVBAR */}
            <nav className="bg-white sticky top-0 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center">
                        <a href="/" className="flex items-center">
                            <img src="/assets/images/eagle_head_black.svg" alt="LOGO" className="h-8 w-auto mr-2" />
                            <span className="font-bold text-xl">AGILA</span>
                        </a>
                    </div>
                </div>
            </nav>

            {/* CENTERED CONTAINER */}
            <div className="flex-grow flex items-center justify-center">
                {/* LOGIN FORM CONTAINER */}
                <div className="max-w-md w-full mx-4 px-6 py-8 bg-white rounded-lg shadow-md">
                    <h1 className="text-2xl font-bold text-center mb-2">Login to your account</h1>
                    <p className="text-gray-600 text-center mb-5">Enter your email and password below to login</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* EMAIL / SCHOOL ID */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="text"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@email.com"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        {/* PASSWORD & FORGOT PASSWORD */}
                        <div>
                            <div className="flex justify-between mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                <a href="/reset-password" className="text-sm text-blue-600 hover:text-blue-800">Forgot Password?</a>
                            </div>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>

                        {/* REMEMBER ME */}
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="remember-me"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">Remember me</label>
                        </div>

                        {/* LOG IN BUTTON */}
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Logging in...' : 'Log in'}
                        </button>
                    </form>

                    {/* LOADING OVERLAY */}
                    {isLoading && (
                        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-75 z-50">
                            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-700">Logging you in, please wait...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;